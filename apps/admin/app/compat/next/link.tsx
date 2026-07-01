
import React from "react";
import { Link as RRLink } from "react-router";
import { ensureTrailingSlash } from "./helper";

type NextLinkProps = Omit<React.ComponentProps<"a">, "href"> & {
  href: string;
  replace?: boolean;
  prefetch?: boolean; // next.js prop, ignored
  scroll?: boolean; // next.js prop, ignored
  shallow?: boolean; // next.js prop, ignored
};

const Link = React.forwardRef<HTMLAnchorElement, NextLinkProps>(function Link(
  { href, replace, prefetch: _prefetch, scroll: _scroll, shallow: _shallow, ...rest },
  ref
) {
  return <RRLink ref={ref} to={ensureTrailingSlash(href)} replace={replace} {...rest} />;
});

Link.displayName = "Link";

export default Link;
