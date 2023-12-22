import type { GetServerSideProps } from 'next';

import AliasPage from '@/features/page/AliasPage';
import { getComponents, getPageData } from '@/features/page/helpers';
import { PageParams, PageWithComponentsStyles } from '@/features/page/types';

export default function Alias(props: PageWithComponentsStyles) {
  return <AliasPage {...props} />;
}

export const getServerSideProps: GetServerSideProps<PageWithComponentsStyles, PageParams> = async ({ params, res }) => {
  try {
    res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=59');

    const alias = (params?.alias ?? []).join('/');
    const data = await getPageData(res.req, alias);
    const components = await getComponents(data.body, res.req);

    return {
      props: { ...data, components }
    };
  } catch (e) {
    console.error(e instanceof Error ? `${e.name} ${e.message}` : 'Error');
    return {
      notFound: true
    };
  }
};
