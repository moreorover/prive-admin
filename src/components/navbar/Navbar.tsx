"use client";

import { ScrollArea } from "@mantine/core";

import { UserButton } from "@/components/user_button/UserButton";
import type { NavItem } from "@/types/nav-item";
import { NavLinksGroup } from "@/components/navbar/NavLinksGroup";
import classes from "./Navbar.module.css";

interface Props {
  data: NavItem[];
  profile: { name: string; email: string };
  hidden?: boolean;
}

export function Navbar({ data, profile }: Props) {
  const links = data.map((item) => (
    <NavLinksGroup key={item.label} {...item} />
  ));

  return (
    <>
      <ScrollArea className={classes.links}>
        <div className={classes.linksInner}>{links}</div>
      </ScrollArea>

      <div className={classes.footer}>
        <UserButton name={profile.name} email={profile.email} />
      </div>
    </>
  );
}
