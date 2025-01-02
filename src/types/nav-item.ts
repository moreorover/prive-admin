import type { Icon, IconProps } from "@tabler/icons-react";
import { ForwardRefExoticComponent, RefAttributes } from "react";

export interface NavItem {
  label: string;
  icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
  link?: string;
  initiallyOpened?: boolean;
  links?: { label: string; link: string }[];
}
