import type { GetServerSideProps } from 'next';

import AliasPage from '@/features/page/AliasPage';
import { getComponents, getPageData } from '@/features/page/helpers';
import { PageParams, PageWithComponentsStyles } from '@/features/page/types';
import { AliasPageType } from '@/types';

export default function HomePage(props: PageWithComponentsStyles) {
  return <AliasPage {...props} />;
}

export const getServerSideProps: GetServerSideProps<PageWithComponentsStyles, PageParams> = async ({ res }) => {
  try {
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=59');

    const data = await getPageData(res.req, undefined, AliasPageType.HOMEPAGE);
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
