type Props = {
  title: string;
  description: string;
};

export function CommonOnboardingHeader({ title, description }: Props) {
  return (
    <div className="space-y-1.5 border-b border-subtle/60 pb-6 text-left">
      <h1 className="text-h4-semibold tracking-tight text-primary">{title}</h1>
      <p className="text-body-md-regular text-tertiary">{description}</p>
    </div>
  );
}
