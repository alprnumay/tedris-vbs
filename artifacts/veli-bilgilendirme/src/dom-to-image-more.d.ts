declare module "dom-to-image-more" {
  interface Options {
    scale?: number;
    width?: number;
    height?: number;
    bgcolor?: string;
    style?: Partial<CSSStyleDeclaration>;
    filter?: (node: Node) => boolean;
    imagePlaceholder?: string;
    cacheBust?: boolean;
  }
  function toPng(node: HTMLElement, options?: Options): Promise<string>;
  function toJpeg(node: HTMLElement, options?: Options): Promise<string>;
  function toBlob(node: HTMLElement, options?: Options): Promise<Blob>;
  function toSvg(node: HTMLElement, options?: Options): Promise<string>;
  const domtoimage: { toPng: typeof toPng; toJpeg: typeof toJpeg; toBlob: typeof toBlob; toSvg: typeof toSvg };
  export default domtoimage;
}
