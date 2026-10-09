import { generateStaticParamsFor, importPage } from "nextra/pages";

import { useMDXComponents } from "../../../mdx-components";

type DocsPageProps = {
  params: Promise<{
    mdxPath?: string[];
  }>;
};

export const generateStaticParams = generateStaticParamsFor("mdxPath");

export async function generateMetadata({
  params,
}: DocsPageProps) {
  const { mdxPath } = await params;
  const { metadata } = await importPage(mdxPath);

  return metadata;
}

const Wrapper = useMDXComponents().wrapper;

export default async function DocsPage(props: DocsPageProps) {
  const resolvedParams = await props.params;

  const {
    default: MDXContent,
    toc,
    metadata,
    sourceCode,
  } = await importPage(resolvedParams.mdxPath);

  return (
    <Wrapper toc={toc} metadata={metadata} sourceCode={sourceCode}>
      <MDXContent {...props} params={resolvedParams} />
    </Wrapper>
  );
}
