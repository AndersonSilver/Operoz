
import React from "react";

type NextImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
};

function Image({ src, alt = "", ...rest }: NextImageProps) {
  return <img src={src} alt={alt} {...rest} />;
}

export default Image;
