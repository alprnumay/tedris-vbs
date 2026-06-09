import { ModulePageHeader, type ModulePageHeaderProps } from "@/modules/davet/layout/ModulePageHeader";

/** @deprecated ModulePageHeader kullanın — geriye dönük uyumluluk */
export type PageHeaderProps = ModulePageHeaderProps;

export function PageHeader(props: PageHeaderProps) {
  const { backLabel, backHref, variant: _variant, ...rest } = props;
  return (
    <ModulePageHeader
      variant="module"
      backLabel={backLabel ?? "Nehari Platformu"}
      backHref={backHref ?? "/"}
      {...rest}
    />
  );
}

export { ModulePageHeader, BackButton, BreadcrumbHeader } from "@/modules/davet/layout/ModulePageHeader";
export type { BackButtonProps, BreadcrumbItem } from "@/modules/davet/layout/ModulePageHeader";
