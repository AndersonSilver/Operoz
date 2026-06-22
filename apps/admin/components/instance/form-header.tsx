export function FormHeader({ heading, subHeading }: { heading: string; subHeading: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-20 leading-7 font-semibold text-primary">{heading}</h1>
      <p className="text-13 leading-5 text-secondary">{subHeading}</p>
    </div>
  );
}
