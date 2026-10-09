import type { ReactNode } from "react";
import {
    Layout,
} from "nextra-theme-docs";
import { getPageMap } from "nextra/page-map";

import "nextra-theme-docs/style.css";
import "./docs-theme.css";

import { Navbar } from "@/components/landing";

import { Banner } from "nextra/components";

import { DocsFooter } from "@/components/docs-footer";

export const metadata = {
    title: {
        default: "Mercy Docs",
        template: "%s – Mercy Docs",
    },
    description:
        "Architecture, SDK, adapters, and extension guides for Mercy.",
};

export default async function DocsLayout({
    children,
}: {
    children: ReactNode;
}) {
    const pageMap = await getPageMap("/docs");

    return (
        <Layout
            banner={
                <Banner storageKey="2.0-release">
                    <a href="http://localhost:3001" target="_blank">
                        🎉 Mercy 1.0 is released. Read more →
                    </a>
                </Banner>
            }
            pageMap={pageMap}
            navbar={
                <Navbar

                />
            }
            footer={
                <DocsFooter></DocsFooter>
            }
            themeSwitch={{
                dark: 'Темный',
                light: 'Светлый',
                system: 'Системный'
            }}
            sidebar={{
                defaultMenuCollapseLevel: 1,
                autoCollapse: true,
            }}
            darkMode={false}
            nextThemes={{
                forcedTheme: "light",
            }}
            editLink={null}
            feedback={{
                content: null,
            }}
        >
            {children} </Layout>
    );
}

