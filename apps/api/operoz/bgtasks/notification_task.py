# Python imports
import json
import uuid
from uuid import UUID


# Module imports
from operoz.db.models import (
    BoardCircleMember,
    IssueMention,
    IssueSubscriber,
    Project,
    User,
    IssueAssignee,
    Issue,
    State,
    EmailNotificationLog,
    Notification,
    IssueComment,
    IssueActivity,
    UserNotificationPreference,
    ProjectMember,
)
from django.db.models import Subquery

# Third Party imports
from celery import shared_task
from bs4 import BeautifulSoup

from operoz.bgtasks.email_notification_task import stack_email_notification

# Activity fields Plane historically skipped for subscriber issue notifications (unless workspace enables extended).
SKIP_EXTENDED_ISSUE_ACTIVITY_FIELDS = frozenset(("cycles", "modules", "reaction", "vote", "draft", "intake"))


# =========== Issue Description Html Parsing and notification Functions ======================


def update_mentions_for_issue(issue, project, new_mentions, removed_mention):
    aggregated_issue_mentions = []
    for mention_id in new_mentions:
        aggregated_issue_mentions.append(
            IssueMention(
                mention_id=mention_id,
                issue=issue,
                project=project,
                workspace_id=project.workspace_id,
            )
        )

    IssueMention.objects.bulk_create(aggregated_issue_mentions, batch_size=100)
    IssueMention.objects.filter(issue=issue, mention__in=removed_mention).delete()


def get_new_mentions(requested_instance, current_instance):
    # requested_data is the newer instance of the current issue
    # current_instance is the older instance of the current issue, saved in the database

    # extract mentions from both the instance of data
    mentions_older = extract_mentions(current_instance)

    mentions_newer = extract_mentions(requested_instance)

    # Getting Set Difference from mentions_newer
    new_mentions = [mention for mention in mentions_newer if mention not in mentions_older]

    return new_mentions


# Get Removed Mention
def get_removed_mentions(requested_instance, current_instance):
    # requested_data is the newer instance of the current issue
    # current_instance is the older instance of the current issue, saved in the database

    # extract mentions from both the instance of data
    mentions_older = extract_mentions(current_instance)
    mentions_newer = extract_mentions(requested_instance)

    # Getting Set Difference from mentions_newer
    removed_mentions = [mention for mention in mentions_older if mention not in mentions_newer]

    return removed_mentions


# Adds mentions as subscribers
def extract_mentions_as_subscribers(project_id, issue_id, mentions):
    # mentions is an array of User IDs representing the FILTERED set of mentioned users

    bulk_mention_subscribers = []

    for mention_id in mentions:
        # If the particular mention has not already been subscribed to the issue, he must be sent the mentioned notification # noqa: E501
        if (
            not IssueSubscriber.objects.filter(
                issue_id=issue_id, subscriber_id=mention_id, project_id=project_id
            ).exists()
            and not IssueAssignee.objects.filter(
                project_id=project_id, issue_id=issue_id, assignee_id=mention_id
            ).exists()
            and not Issue.objects.filter(project_id=project_id, pk=issue_id, created_by_id=mention_id).exists()
            and ProjectMember.objects.filter(project_id=project_id, member_id=mention_id, is_active=True).exists()
        ):
            project = Project.objects.get(pk=project_id)

            bulk_mention_subscribers.append(
                IssueSubscriber(
                    workspace_id=project.workspace_id,
                    project_id=project_id,
                    issue_id=issue_id,
                    subscriber_id=mention_id,
                )
            )
    return bulk_mention_subscribers


# Expande uma menção de círculo (board_circle) na lista de IDs de usuário dos seus membros.
def _expand_circle_mention(circle_id):
    return list(
        BoardCircleMember.objects.filter(circle_id=circle_id, deleted_at__isnull=True).values_list(
            "user_id", flat=True
        )
    )


def _extract_mention_ids_from_soup(soup):
    mentions = [tag["entity_identifier"] for tag in soup.find_all("mention-component", attrs={"entity_name": "user_mention"})]
    circle_tags = soup.find_all("mention-component", attrs={"entity_name": "board_circle"})
    for circle_tag in circle_tags:
        mentions.extend(_expand_circle_mention(circle_tag["entity_identifier"]))
    return list(set(str(mention_id) for mention_id in mentions))


# Parse Issue Description & extracts mentions
def extract_mentions(issue_instance):
    try:
        # issue_instance has to be a dictionary passed, containing the description_html and other set of activity data. # noqa: E501
        # Convert string to dictionary
        data = json.loads(issue_instance)
        html = data.get("description_html")
        soup = BeautifulSoup(html, "html.parser")
        return _extract_mention_ids_from_soup(soup)
    except Exception:
        return []


# =========== Comment Parsing and notification Functions ======================
def extract_comment_mentions(comment_value):
    try:
        soup = BeautifulSoup(comment_value, "html.parser")
        return _extract_mention_ids_from_soup(soup)
    except Exception:
        return []


def get_new_comment_mentions(new_value, old_value):
    mentions_newer = extract_comment_mentions(new_value)
    if old_value is None:
        return mentions_newer

    mentions_older = extract_comment_mentions(old_value)
    # Getting Set Difference from mentions_newer
    new_mentions = [mention for mention in mentions_newer if mention not in mentions_older]

    return new_mentions


def create_mention_notification(project, notification_comment, issue, actor_id, mention_id, issue_id, activity):
    return Notification(
        workspace=project.workspace,
        sender="in_app:issue_activities:mentioned",
        triggered_by_id=actor_id,
        receiver_id=mention_id,
        entity_identifier=issue_id,
        entity_name="issue",
        project=project,
        message=notification_comment,
        data={
            "issue": {
                "id": str(issue_id),
                "name": str(issue.name),
                "identifier": str(issue.project.identifier),
                "sequence_id": issue.sequence_id,
                "state_name": issue.state.name,
                "state_group": issue.state.group,
            },
            "issue_activity": {
                "id": str(activity.get("id")),
                "verb": str(activity.get("verb")),
                "field": str(activity.get("field")),
                "actor": str(activity.get("actor_id")),
                "new_value": str(activity.get("new_value")),
                "old_value": str(activity.get("old_value")),
                "old_identifier": (str(activity.get("old_identifier")) if activity.get("old_identifier") else None),
                "new_identifier": (str(activity.get("new_identifier")) if activity.get("new_identifier") else None),
            },
        },
    )


@shared_task
def notifications(
    type,
    issue_id,
    project_id,
    actor_id,
    subscriber,
    issue_activities_created,
    requested_data,
    current_instance,
):
    try:
        issue_activities_created = (
            json.loads(issue_activities_created) if issue_activities_created is not None else None
        )
        if issue_activities_created:
            project = Project.objects.select_related("workspace").filter(pk=project_id).first()
            if project is None:
                return
            workspace = project.workspace

            activities_for_notifications = (
                issue_activities_created
                if workspace.issue_notify_email_include_extended_activities
                else [a for a in issue_activities_created if a.get("field") not in SKIP_EXTENDED_ISSUE_ACTIVITY_FIELDS]
            )
            if not activities_for_notifications:
                return

            # Create Notifications
            bulk_notifications = []
            bulk_email_logs = []

            """
            Mention Tasks
            1. Perform Diffing and Extract the mentions, that mention notification needs to be sent
            2. From the latest set of mentions, extract the users which are not a subscribers & make them subscribers
            """

            # get the list of active project members
            project_members = ProjectMember.objects.filter(project_id=project_id, is_active=True).values_list(
                "member_id", flat=True
            )

            # Get new mentions from the newer instance
            new_mentions = get_new_mentions(requested_instance=requested_data, current_instance=current_instance)
            new_mentions = list(set(new_mentions) & {str(member) for member in project_members})
            removed_mention = get_removed_mentions(requested_instance=requested_data, current_instance=current_instance)

            comment_mentions = []
            all_comment_mentions = []

            # Get New Subscribers from the mentions of the newer instance
            requested_mentions = extract_mentions(issue_instance=requested_data)
            mention_subscribers = extract_mentions_as_subscribers(
                project_id=project_id, issue_id=issue_id, mentions=requested_mentions
            )

            for issue_activity in issue_activities_created:
                issue_comment = issue_activity.get("issue_comment")
                issue_comment_new_value = issue_activity.get("new_value")
                issue_comment_old_value = issue_activity.get("old_value")
                if issue_comment is not None:
                    # TODO: Maybe save the comment mentions, so that in future, we can filter out the issues based on comment mentions as well.

                    all_comment_mentions = all_comment_mentions + extract_comment_mentions(issue_comment_new_value)

                    new_comment_mentions = get_new_comment_mentions(
                        old_value=issue_comment_old_value,
                        new_value=issue_comment_new_value,
                    )
                    comment_mentions = comment_mentions + new_comment_mentions
                    comment_mentions = [
                        mention for mention in comment_mentions if UUID(mention) in set(project_members)
                    ]

            comment_mention_subscribers = extract_mentions_as_subscribers(
                project_id=project_id, issue_id=issue_id, mentions=all_comment_mentions
            )
            """
            We will not send subscription activity notification to the below mentioned user sets
            - Those who have been newly mentioned in the issue description, we will send mention notification to them.
            - When the activity is a comment_created and there exist a mention in the comment, 
              then we have to send the "mention_in_comment" notification
            - When the activity is a comment_updated and there exist a mention change, 
              then also we have to send the "mention_in_comment" notification
            """

            # ---------------------------------------------------------------------------------------------------------
            issue_subscribers = list(
                IssueSubscriber.objects.filter(
                    project_id=project_id,
                    issue_id=issue_id,
                    subscriber__in=Subquery(project_members),
                )
                .exclude(subscriber_id__in=list(new_mentions + comment_mentions + [actor_id]))
                .values_list("subscriber", flat=True)
            )

            issue = Issue.objects.filter(pk=issue_id).first()
            if issue is None:
                return

            if subscriber:
                # add the user to issue subscriber
                try:
                    _ = IssueSubscriber.objects.get_or_create(
                        project_id=project_id, issue_id=issue_id, subscriber_id=actor_id
                    )
                except Exception:
                    pass

            issue_assignees = IssueAssignee.objects.filter(
                issue_id=issue_id,
                project_id=project_id,
                assignee__in=Subquery(project_members),
            ).values_list("assignee", flat=True)
            assignee_set = set(issue_assignees)
            project_member_set = set(project_members)

            try:
                actor_uuid = uuid.UUID(str(actor_id))
            except ValueError:
                actor_uuid = None
            actor_only = {actor_uuid} if actor_uuid else set()
            if workspace.issue_notify_assignees_always_email:
                # Include assignees and issue creator (when still a project member). UI "owner" is often
                # created_by without IssueAssignee rows; they were missing from this list before.
                recipients = set(issue_subscribers) | assignee_set
                cb = issue.created_by_id
                if cb and cb in project_member_set:
                    recipients.add(cb)
                issue_subscribers = list(recipients - actor_only)
            else:
                issue_subscribers = list(set(issue_subscribers) - actor_only)

            for subscriber in issue_subscribers:
                if issue.created_by_id and issue.created_by_id == subscriber:
                    sender = "in_app:issue_activities:created"
                elif subscriber in assignee_set and issue.created_by_id not in assignee_set:
                    sender = "in_app:issue_activities:assigned"
                else:
                    sender = "in_app:issue_activities:subscribed"

                preference = UserNotificationPreference.objects.get(user_id=subscriber)
                is_assignee = subscriber in assignee_set
                is_issue_creator = bool(issue.created_by_id and issue.created_by_id == subscriber)

                for issue_activity in activities_for_notifications:
                    issue_detail = issue_activity.get("issue_detail")
                    if issue_detail is not None and str(issue_detail.get("id")) != str(issue_id):
                        continue

                    if (
                        not workspace.issue_notify_email_include_description_changes
                        and issue_activity.get("field") == "description"
                    ):
                        continue

                    send_email = False
                    if workspace.issue_notify_assignees_always_email and (is_assignee or is_issue_creator):
                        send_email = True
                    elif issue_activity.get("field") == "state" and preference.state_change:
                        send_email = True
                    elif (
                        issue_activity.get("field") == "state"
                        and preference.issue_completed
                        and State.objects.filter(
                            project_id=project_id,
                            pk=issue_activity.get("new_identifier"),
                            group="completed",
                        ).exists()
                    ):
                        send_email = True
                    elif issue_activity.get("field") == "comment" and preference.comment:
                        send_email = True
                    elif preference.property_change:
                        send_email = True

                    # If activity is of issue comment fetch the comment
                    issue_comment = (
                        IssueComment.objects.filter(
                            id=issue_activity.get("issue_comment"),
                            issue_id=issue_id,
                            project_id=project_id,
                            workspace_id=project.workspace_id,
                        ).first()
                        if issue_activity.get("issue_comment")
                        else None
                    )

                    # Create in app notification
                    bulk_notifications.append(
                        Notification(
                            workspace=project.workspace,
                            sender=sender,
                            triggered_by_id=actor_id,
                            receiver_id=subscriber,
                            entity_identifier=issue_id,
                            entity_name="issue",
                            project=project,
                            title=issue_activity.get("comment"),
                            data={
                                "issue": {
                                    "id": str(issue_id),
                                    "name": str(issue.name),
                                    "identifier": str(issue.project.identifier),
                                    "sequence_id": issue.sequence_id,
                                    "state_name": issue.state.name,
                                    "state_group": issue.state.group,
                                },
                                "issue_activity": {
                                    "id": str(issue_activity.get("id")),
                                    "verb": str(issue_activity.get("verb")),
                                    "field": str(issue_activity.get("field")),
                                    "actor": str(issue_activity.get("actor_id")),
                                    "new_value": str(issue_activity.get("new_value")),
                                    "old_value": str(issue_activity.get("old_value")),
                                    "issue_comment": str(
                                        issue_comment.comment_stripped if issue_comment is not None else ""
                                    ),
                                    "old_identifier": (
                                        str(issue_activity.get("old_identifier"))
                                        if issue_activity.get("old_identifier")
                                        else None
                                    ),
                                    "new_identifier": (
                                        str(issue_activity.get("new_identifier"))
                                        if issue_activity.get("new_identifier")
                                        else None
                                    ),
                                },
                            },
                        )
                    )
                    # Create email notification
                    if send_email:
                        bulk_email_logs.append(
                            EmailNotificationLog(
                                triggered_by_id=actor_id,
                                receiver_id=subscriber,
                                entity_identifier=issue_id,
                                entity_name="issue",
                                data={
                                    "issue": {
                                        "id": str(issue_id),
                                        "name": str(issue.name),
                                        "identifier": str(issue.project.identifier),
                                        "project_id": str(issue.project.id),
                                        "workspace_slug": str(issue.project.workspace.slug),
                                        "sequence_id": issue.sequence_id,
                                        "state_name": issue.state.name,
                                        "state_group": issue.state.group,
                                    },
                                    "issue_activity": {
                                        "id": str(issue_activity.get("id")),
                                        "verb": str(issue_activity.get("verb")),
                                        "field": str(issue_activity.get("field")),
                                        "actor": str(issue_activity.get("actor_id")),
                                        "new_value": str(issue_activity.get("new_value")),
                                        "old_value": str(issue_activity.get("old_value")),
                                        "issue_comment": str(
                                            issue_comment.comment_stripped if issue_comment is not None else ""
                                        ),
                                        "old_identifier": (
                                            str(issue_activity.get("old_identifier"))
                                            if issue_activity.get("old_identifier")
                                            else None
                                        ),
                                        "new_identifier": (
                                            str(issue_activity.get("new_identifier"))
                                            if issue_activity.get("new_identifier")
                                            else None
                                        ),
                                        "activity_time": issue_activity.get("created_at"),
                                    },
                                },
                            )
                        )

            # -------------------------------------------------------------------------------------------------------- #

            # Add Mentioned as Issue Subscribers
            IssueSubscriber.objects.bulk_create(
                mention_subscribers + comment_mention_subscribers,
                batch_size=100,
                ignore_conflicts=True,
            )

            last_activity = IssueActivity.objects.filter(issue_id=issue_id).order_by("-created_at").first()

            actor = User.objects.get(pk=actor_id)

            for mention_id in comment_mentions:
                if mention_id != actor_id:
                    preference = UserNotificationPreference.objects.get(user_id=mention_id)
                    for issue_activity in activities_for_notifications:
                        notification = create_mention_notification(
                            project=project,
                            issue=issue,
                            notification_comment=f"{actor.display_name} has mentioned you in a comment in issue {issue.name}",  # noqa: E501
                            actor_id=actor_id,
                            mention_id=mention_id,
                            issue_id=issue_id,
                            activity=issue_activity,
                        )

                        # check for email notifications
                        if preference.mention:
                            bulk_email_logs.append(
                                EmailNotificationLog(
                                    triggered_by_id=actor_id,
                                    receiver_id=mention_id,
                                    entity_identifier=issue_id,
                                    entity_name="issue",
                                    data={
                                        "issue": {
                                            "id": str(issue_id),
                                            "name": str(issue.name),
                                            "identifier": str(issue.project.identifier),
                                            "sequence_id": issue.sequence_id,
                                            "state_name": issue.state.name,
                                            "state_group": issue.state.group,
                                            "project_id": str(issue.project.id),
                                            "workspace_slug": str(issue.project.workspace.slug),
                                        },
                                        "issue_activity": {
                                            "id": str(issue_activity.get("id")),
                                            "verb": str(issue_activity.get("verb")),
                                            "field": str("mention"),
                                            "actor": str(issue_activity.get("actor_id")),
                                            "new_value": str(issue_activity.get("new_value")),
                                            "old_value": str(issue_activity.get("old_value")),
                                            "old_identifier": (
                                                str(issue_activity.get("old_identifier"))
                                                if issue_activity.get("old_identifier")
                                                else None
                                            ),
                                            "new_identifier": (
                                                str(issue_activity.get("new_identifier"))
                                                if issue_activity.get("new_identifier")
                                                else None
                                            ),
                                            "activity_time": issue_activity.get("created_at"),
                                        },
                                    },
                                )
                            )
                        bulk_notifications.append(notification)

            for mention_id in new_mentions:
                if mention_id != actor_id:
                    preference = UserNotificationPreference.objects.get(user_id=mention_id)
                    if (
                        last_activity is not None
                        and last_activity.field == "description"
                        and actor_id == str(last_activity.actor_id)
                    ):
                        bulk_notifications.append(
                            Notification(
                                workspace=project.workspace,
                                sender="in_app:issue_activities:mentioned",
                                triggered_by_id=actor_id,
                                receiver_id=mention_id,
                                entity_identifier=issue_id,
                                entity_name="issue",
                                project=project,
                                message=f"You have been mentioned in the issue {issue.name}",
                                data={
                                    "issue": {
                                        "id": str(issue_id),
                                        "name": str(issue.name),
                                        "identifier": str(issue.project.identifier),
                                        "sequence_id": issue.sequence_id,
                                        "state_name": issue.state.name,
                                        "state_group": issue.state.group,
                                        "project_id": str(issue.project.id),
                                        "workspace_slug": str(issue.project.workspace.slug),
                                    },
                                    "issue_activity": {
                                        "id": str(last_activity.id),
                                        "verb": str(last_activity.verb),
                                        "field": str(last_activity.field),
                                        "actor": str(last_activity.actor_id),
                                        "new_value": str(last_activity.new_value),
                                        "old_value": str(last_activity.old_value),
                                        "old_identifier": (
                                            str(last_activity.old_identifier) if last_activity.old_identifier else None
                                        ),
                                        "new_identifier": (
                                            str(last_activity.new_identifier) if last_activity.new_identifier else None
                                        ),
                                    },
                                },
                            )
                        )
                        if preference.mention:
                            bulk_email_logs.append(
                                EmailNotificationLog(
                                    triggered_by_id=actor_id,
                                    receiver_id=mention_id,
                                    entity_identifier=issue_id,
                                    entity_name="issue",
                                    data={
                                        "issue": {
                                            "id": str(issue_id),
                                            "name": str(issue.name),
                                            "identifier": str(issue.project.identifier),
                                            "sequence_id": issue.sequence_id,
                                            "state_name": issue.state.name,
                                            "state_group": issue.state.group,
                                        },
                                        "issue_activity": {
                                            "id": str(last_activity.id),
                                            "verb": str(last_activity.verb),
                                            "field": "mention",
                                            "actor": str(last_activity.actor_id),
                                            "new_value": str(last_activity.new_value),
                                            "old_value": str(last_activity.old_value),
                                            "old_identifier": (
                                                str(last_activity.old_identifier)
                                                if last_activity.old_identifier
                                                else None
                                            ),
                                            "new_identifier": (
                                                str(last_activity.new_identifier)
                                                if last_activity.new_identifier
                                                else None
                                            ),
                                            "activity_time": str(last_activity.created_at),
                                        },
                                    },
                                )
                            )
                    else:
                        for issue_activity in activities_for_notifications:
                            notification = create_mention_notification(
                                project=project,
                                issue=issue,
                                notification_comment=f"You have been mentioned in the issue {issue.name}",
                                actor_id=actor_id,
                                mention_id=mention_id,
                                issue_id=issue_id,
                                activity=issue_activity,
                            )
                            if preference.mention:
                                bulk_email_logs.append(
                                    EmailNotificationLog(
                                        triggered_by_id=actor_id,
                                        receiver_id=mention_id,
                                        entity_identifier=issue_id,
                                        entity_name="issue",
                                        data={
                                            "issue": {
                                                "id": str(issue_id),
                                                "name": str(issue.name),
                                                "identifier": str(issue.project.identifier),
                                                "sequence_id": issue.sequence_id,
                                                "state_name": issue.state.name,
                                                "state_group": issue.state.group,
                                            },
                                            "issue_activity": {
                                                "id": str(issue_activity.get("id")),
                                                "verb": str(issue_activity.get("verb")),
                                                "field": str("mention"),
                                                "actor": str(issue_activity.get("actor_id")),
                                                "new_value": str(issue_activity.get("new_value")),
                                                "old_value": str(issue_activity.get("old_value")),
                                                "old_identifier": (
                                                    str(issue_activity.get("old_identifier"))
                                                    if issue_activity.get("old_identifier")
                                                    else None
                                                ),
                                                "new_identifier": (
                                                    str(issue_activity.get("new_identifier"))
                                                    if issue_activity.get("new_identifier")
                                                    else None
                                                ),
                                                "activity_time": issue_activity.get("created_at"),
                                            },
                                        },
                                    )
                                )
                            bulk_notifications.append(notification)

            # save new mentions for the particular issue and remove the mentions that has been deleted from the description # noqa: E501
            update_mentions_for_issue(
                issue=issue,
                project=project,
                new_mentions=new_mentions,
                removed_mention=removed_mention,
            )
            # Bulk create notifications
            Notification.objects.bulk_create(bulk_notifications, batch_size=100)
            EmailNotificationLog.objects.bulk_create(bulk_email_logs, batch_size=100, ignore_conflicts=True)
            if workspace.issue_notify_email_dispatch_immediately:
                stack_email_notification.delay()
        return
    except Exception as e:
        print(e)
        return
