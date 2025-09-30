import { builder, BuilderComponent } from '@builder.io/react';

builder.init('3a3793f3d4b541cbb825ad79942d6eef'); // replace with your Builder API key

export async function getStaticProps({ params }) {
  const urlPath = '/' + (params?.page?.join('/') || '');
  const page = await builder.get('page', {
    userAttributes: { urlPath }
  }).toPromise();

  return { props: { page }, revalidate: 5 };
}

export async function getStaticPaths() {
  return { paths: [], fallback: true };
}

export default function Page({ page }) {
  return <BuilderComponent model="page" content={page} />;
}
