export function AuthFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto w-full pt-8 lg:hidden">
      <p className="text-center text-13 text-secondary">© {year} Operoz</p>
    </footer>
  );
}
