from .project.base import (
    ProjectViewSet,
    ProjectIdentifierEndpoint,
    ProjectUserViewsEndpoint,
    ProjectFavoritesViewSet,
    DeployBoardViewSet,
    ProjectArchiveUnarchiveEndpoint,
)
from .project.custom_fields import ProjectCustomFieldEndpoint
from .project.custom_field_values import (
    BoardProjectFormLayoutEndpoint,
    ProjectCustomFieldValueEndpoint,
    ProjectFormLayoutEndpoint,
)
from .project.issue_types import ProjectIssueTypeEndpoint

from .project.invite import (
    UserProjectInvitationsViewset,
    ProjectInvitationsViewset,
    ProjectJoinEndpoint,
)

from .project.member import (
    ProjectMemberViewSet,
    ProjectMemberUserEndpoint,
    UserProjectRolesEndpoint,
    ProjectMemberPreferenceEndpoint,
)

from .user.base import (
    UserEndpoint,
    UpdateUserOnBoardedEndpoint,
    UpdateUserTourCompletedEndpoint,
    UserActivityEndpoint,
)


from .base import BaseAPIView, BaseViewSet

from .workspace.base import (
    WorkSpaceViewSet,
    UserWorkSpacesEndpoint,
    WorkSpaceAvailabilityCheckEndpoint,
    UserWorkspaceDashboardEndpoint,
    WorkspaceThemeViewSet,
    ExportWorkspaceUserActivityEndpoint,
)
from .workspace.ownership import WorkspaceTransferOwnershipEndpoint

from .workspace.draft import WorkspaceDraftIssueViewSet

from .workspace.home import WorkspaceHomePreferenceViewSet

from .workspace.favorite import (
    WorkspaceFavoriteEndpoint,
    WorkspaceFavoriteGroupEndpoint,
)
from .workspace.recent_visit import UserRecentVisitViewSet
from .workspace.user_preference import WorkspaceUserPreferenceViewSet
from .workspace.client_360 import WorkspaceClient360ViewSet
from .workspace.client_360_display_settings import WorkspaceClient360DisplaySettingsEndpoint

from .workspace.member import (
    WorkSpaceMemberViewSet,
    WorkspaceMemberUserEndpoint,
    WorkspaceProjectMemberEndpoint,
    WorkspaceMemberUserViewsEndpoint,
)
from .workspace.invite import (
    WorkspaceInvitationsViewset,
    WorkspaceJoinEndpoint,
    UserWorkspaceInvitationsViewSet,
)
from .workspace.label import WorkspaceLabelsEndpoint
from .workspace.state import WorkspaceStatesEndpoint
from .workspace.user import (
    UserLastProjectWithWorkspaceEndpoint,
    WorkspaceUserProfileIssuesEndpoint,
    WorkspaceUserPropertiesEndpoint,
    WorkspaceUserProfileEndpoint,
    WorkspaceUserActivityEndpoint,
    WorkspaceUserProfileStatsEndpoint,
    UserActivityGraphEndpoint,
    UserIssueCompletedGraphEndpoint,
)
from .workspace.estimate import WorkspaceEstimatesEndpoint
from .workspace.module import WorkspaceModulesEndpoint
from .workspace.cycle import WorkspaceCyclesEndpoint
from .workspace.quick_link import QuickLinkViewSet
from .workspace.sticky import WorkspaceStickyViewSet
from .workspace.jira_sync import WorkspaceJiraOpsSyncEndpoint, WorkspaceJiraOpsSyncPreviewEndpoint
from .workspace.jira_oauth import (
    JiraOpsOAuthCallbackEndpoint,
    WorkspaceJiraOpsJiraProjectsEndpoint,
    WorkspaceJiraOpsOAuthCompleteEndpoint,
    WorkspaceJiraOpsOAuthSitesEndpoint,
    WorkspaceJiraOpsOAuthStartEndpoint,
)
from .board import (
    BoardCustomFieldBulkAddEndpoint,
    BoardCustomFieldDetailEndpoint,
    BoardCustomFieldEndpoint,
    BoardIssueTypeDetailEndpoint,
    BoardIssueTypeEndpoint,
    BoardModuleStageDetailEndpoint,
    BoardModuleStageEndpoint,
    BoardIssuesViewSet,
    BoardMemberDetailEndpoint,
    BoardMemberEndpoint,
    BoardClient360ViewSet,
    BoardClient360HealthSettingsEndpoint,
    BoardMetaViewSet,
    BoardModulesViewSet,
    BoardPermissionCatalogEndpoint,
    ProjectBoardPermissionsEndpoint,
    BoardStatusReportDetailEndpoint,
    BoardStatusReportEndpoint,
    BoardStatusReportExportEndpoint,
    BoardProjectFieldLayoutDetailEndpoint,
    BoardProjectFieldLayoutEndpoint,
    BoardRoleDetailEndpoint,
    BoardRoleDuplicateEndpoint,
    BoardRoleEndpoint,
    BoardViewSet,
    BoardEmailNotificationAuditEndpoint,
    BoardAutomationCatalogEndpoint,
    BoardAutomationDeadLetterListEndpoint,
    BoardAutomationDryRunEndpoint,
    BoardAutomationMetricsEndpoint,
    BoardAutomationRuleDetailEndpoint,
    BoardAutomationRuleListEndpoint,
    BoardAutomationRulePublishEndpoint,
    BoardAutomationRuleRevisionListEndpoint,
    BoardAutomationRuleRevisionRestoreEndpoint,
    BoardAutomationRunListEndpoint,
    BoardAutomationHookDetailEndpoint,
    BoardAutomationHookListEndpoint,
    BoardAutomationPolicyEndpoint,
    BoardAutomationPublishAuditListEndpoint,
    BoardPlaybookDetailEndpoint,
    BoardPlaybookListEndpoint,
    BoardPlaybookPublishEndpoint,
    BoardIntakeFormDetailEndpoint,
    BoardIntakeFormListCreateEndpoint,
    BoardSupportQueueDetailEndpoint,
    BoardSupportQueueListCreateEndpoint,
    BoardSupportSlaPolicyEndpoint,
    BoardAutomationPackInstallEndpoint,
    BoardAutomationPackListEndpoint,
    BoardAutomationPackUninstallEndpoint,
    BoardAutomationTemplateInstallEndpoint,
    BoardAutomationTemplateListEndpoint,
    BoardAutomationSecretDetailEndpoint,
    BoardAutomationSecretListEndpoint,
    BoardAutomationValidateEndpoint,
    BoardAutomationScriptDetailEndpoint,
    BoardAutomationScriptListEndpoint,
    BoardAutomationEmailTemplateDetailEndpoint,
    BoardAutomationEmailTemplateListEndpoint,
    WorkspaceCustomFieldDetailEndpoint,
    WorkspaceCustomFieldEndpoint,
)

from .state.base import StateViewSet, IntakeStateEndpoint
from .view.base import (
    WorkspaceViewViewSet,
    WorkspaceViewIssuesViewSet,
    IssueViewViewSet,
    IssueViewFavoriteViewSet,
)
from .cycle.base import (
    CycleViewSet,
    CycleDateCheckEndpoint,
    CycleFavoriteViewSet,
    TransferCycleIssueEndpoint,
    CycleUserPropertiesEndpoint,
    CycleAnalyticsEndpoint,
    CycleProgressEndpoint,
)
from .cycle.issue import CycleIssueViewSet
from .cycle.archive import CycleArchiveUnarchiveEndpoint

from .asset.base import FileAssetEndpoint, UserAssetsEndpoint, FileAssetViewSet
from .asset.v2 import (
    WorkspaceFileAssetEndpoint,
    UserAssetsV2Endpoint,
    StaticFileAssetEndpoint,
    AssetRestoreEndpoint,
    ProjectAssetEndpoint,
    ProjectBulkAssetEndpoint,
    AssetCheckEndpoint,
    DuplicateAssetEndpoint,
    WorkspaceAssetDownloadEndpoint,
    ProjectAssetDownloadEndpoint,
)
from .issue.base import (
    IssueListEndpoint,
    IssueViewSet,
    ProjectUserDisplayPropertyEndpoint,
    BulkDeleteIssuesEndpoint,
    BulkOperationIssuesEndpoint,
    DeletedIssuesListViewSet,
    IssuePaginatedViewSet,
    IssueDetailEndpoint,
    IssueBulkUpdateDateEndpoint,
    IssueMetaEndpoint,
    IssueDetailIdentifierEndpoint,
)

from .issue.activity import IssueActivityEndpoint

from .issue.archive import IssueArchiveViewSet, BulkArchiveIssuesEndpoint

from .issue.attachment import (
    IssueAttachmentEndpoint,
    # V2
    IssueAttachmentV2Endpoint,
)

from .issue.comment import IssueCommentViewSet, CommentReactionViewSet

from .issue.label import LabelViewSet, BulkCreateIssueLabelsEndpoint

from .issue.link import IssueLinkViewSet

from .issue.relation import IssueRelationViewSet

from .issue.reaction import IssueReactionViewSet

from .issue.sub_issue import SubIssuesEndpoint

from .issue.custom_fields import IssueCustomFieldValueEndpoint
from .issue.subscriber import IssueSubscriberViewSet

from .issue.version import IssueVersionEndpoint, WorkItemDescriptionVersionEndpoint

from .module.base import (
    ModuleViewSet,
    ModuleLinkViewSet,
    ModuleFavoriteViewSet,
    ModuleUserPropertiesEndpoint,
)

from .module.issue import ModuleIssueViewSet

from .module.archive import ModuleArchiveUnarchiveEndpoint

from .api import ApiTokenEndpoint

from .page.base import (
    PageViewSet,
    PageFavoriteViewSet,
    PagesDescriptionViewSet,
    PageDuplicateEndpoint,
)
from .page.version import PageVersionEndpoint

from .search.base import GlobalSearchEndpoint, SearchEndpoint
from .search.issue import IssueSearchEndpoint


from .external.base import (
    GPTIntegrationEndpoint,
    UnsplashEndpoint,
    WorkspaceGPTIntegrationEndpoint,
)
from .estimate.base import (
    ProjectEstimatePointEndpoint,
    BulkEstimatePointEndpoint,
    EstimatePointEndpoint,
)

from operis.app.views.intake.form import IntakeFormDetailEndpoint, IntakeFormListCreateEndpoint
from operis.app.views.intake.support_queue import ProjectSupportQueueListEndpoint
from .intake.base import (
    IntakeViewSet,
    IntakeIssueViewSet,
    IntakeWorkItemDescriptionVersionEndpoint,
)

from .analytic.base import (
    AnalyticsEndpoint,
    AnalyticViewViewset,
    SavedAnalyticEndpoint,
    ExportAnalyticsEndpoint,
    DefaultAnalyticsEndpoint,
    ProjectStatsEndpoint,
)

from .analytic.advance import (
    AdvanceAnalyticsEndpoint,
    AdvanceAnalyticsStatsEndpoint,
    AdvanceAnalyticsChartEndpoint,
)

from .analytic.project_analytics import (
    ProjectAdvanceAnalyticsEndpoint,
    ProjectAdvanceAnalyticsStatsEndpoint,
    ProjectAdvanceAnalyticsChartEndpoint,
)

from .notification.base import (
    NotificationViewSet,
    UnreadNotificationEndpoint,
    UserNotificationPreferenceEndpoint,
)

from .exporter.base import ExportIssuesEndpoint


from .webhook.base import (
    WebhookEndpoint,
    WebhookLogsEndpoint,
    WebhookSecretRegenerateEndpoint,
)

from .error_404 import custom_404_view

from .notification.base import MarkAllReadNotificationViewSet
from .user.base import AccountEndpoint, ProfileEndpoint, UserSessionEndpoint

from .timezone.base import TimezoneEndpoint
