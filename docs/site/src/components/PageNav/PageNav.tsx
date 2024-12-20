// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { Icon } from "@synnaxlabs/media";
import { Button } from "@synnaxlabs/pluto/button";
import { Dropdown } from "@synnaxlabs/pluto/dropdown";
import { Tree } from "@synnaxlabs/pluto/tree";
import { type ReactElement, useEffect, useState } from "react";

import { componentsPages, guidesPages } from "@/pages/_nav";

export type PageNavNode = Tree.Node;

export interface TOCProps {
  currentPage: string;
}

export const useDocumentSize = (): number | null => {
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    const handleResize = (): void => setWidth(document.documentElement.clientWidth);
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return width;
};

interface ReferenceTreeProps {
  currentPage: string;
}

const Reference = ({ currentPage }: ReferenceTreeProps): ReactElement => {
  let parts = currentPage.split("/").filter((part) => part !== "");
  if (parts.length <= 1) parts = componentsPages.map((p) => p.key);
  if (currentPage === "/guides/") currentPage = "/reference/";
  const treeProps = Tree.use({
    nodes: componentsPages,
    initialExpanded: parts,
    sort: false,
  });
  return (
    <Tree.Tree
      {...treeProps}
      className="tree reference-tree styled-scrollbar"
      virtual={false}
      selected={[currentPage]}
      useMargin
    />
  );
};

const Guides = ({ currentPage }: TOCProps): ReactElement => {
  let parts = currentPage.split("/").filter((part) => part !== "");
  if (parts.length <= 1) parts = guidesPages.map((p) => p.key);
  if (currentPage === "/reference/") currentPage = "/guides/";
  const treeProps = Tree.use({
    nodes: guidesPages,
    initialExpanded: parts,
    sort: false,
  });
  return (
    <Tree.Tree
      {...treeProps}
      className="tree role-tree styled-scrollbar"
      virtual={false}
      selected={[currentPage]}
      useMargin
    />
  );
};

export const PageNav = ({ currentPage }: TOCProps): ReactElement | null => {
  const width = useDocumentSize();

  // Split the current page by slashes and remove and get the first part
  const selectedTab = currentPage.split("/").filter((part) => part !== "")[0];

  const { visible, toggle, close } = Dropdown.use({ initialVisible: false });

  let tree = <Reference currentPage={currentPage} />;
  if (selectedTab === "guides") tree = <Guides currentPage={currentPage} />;

  if (width == null) return null;
  if (width > 865) return tree;
  return (
    <Dropdown.Dialog visible={visible} close={close} variant="floating">
      <Button.Button
        justify="spaceBetween"
        endIcon={<Icon.Menu />}
        variant="text"
        onClick={() => toggle(!visible)}
        size="medium"
        style={{
          border: "none",
        }}
      >
        Menu
      </Button.Button>
      {tree}
    </Dropdown.Dialog>
  );
};
