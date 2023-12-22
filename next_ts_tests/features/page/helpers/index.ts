import { IncomingMessage } from 'http';

import { URLS } from '@/constants';
import { PageInterface, ServerPage } from '@/features/page/types';
import { Components } from '@/layouts/PageLayout';
import { serverSidePropsBaseURL } from '@/services/api';
import { AliasPageType } from '@/types';

const findComponents = (blocks: any[]): string[] => {
  const components = [];
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].name === 'erom/component') {
      components.push(blocks[i]?.attributes.component);
    }
    if (blocks[i].innerBlocks && blocks[i].innerBlocks.length) {
      components.push(...findComponents(blocks[i].innerBlocks));
    }
  }
  return components ?? [];
};

const getComponents = async (body: string, req: IncomingMessage): Promise<Components> => {
  const styles: { [key: string]: { rawBody: string; compiledStyles: string } } = {};
  const parsedBody = JSON.parse(body);
  const components = findComponents(parsedBody);
  if (components.length) {
    for (const component of components) {
      if (Object.keys(styles).find(s => s === component)) {
        continue;
      }
      try {
        const result = await fetch(`${serverSidePropsBaseURL(req, URLS.component)}/raw/${component}`);
        if (result.status === 200) {
          const componentData = await result.json();
          Object.assign(styles, {
            [component]: JSON.parse(JSON.stringify(componentData))
          });
        }
      } catch (e) {
        console.log(e);
      }
    }
  }
  return Promise.resolve(styles);
};

const getPageData = async (
  req: IncomingMessage,
  alias: string | undefined,
  aliasType: AliasPageType = AliasPageType.DEFAULT
): Promise<PageInterface> => {
  let url: string;
  switch (aliasType) {
    case AliasPageType.HOMEPAGE:
      url = `${serverSidePropsBaseURL(req, URLS.page)}/homepage`;
      break;
    case AliasPageType.FORBIDDEN_PAGE:
      url = `${serverSidePropsBaseURL(req, URLS.page)}/forbidden-page`;
      break;
    default:
      url = `${serverSidePropsBaseURL(req, URLS.page)}/preview?alias=${alias}`;
      break;
  }
  const result = await fetch(url);
  const serverPage: ServerPage = await result.json();
  const page: PageInterface = { ...serverPage, template: null, settings: null, author: null, tags: [] };
  if (serverPage.template) {
    let template;
    try {
      template = JSON.parse(serverPage.template);
    } catch (e) {}
    if (template && template.length) {
      page.template = template[0];
    }
  }
  if (serverPage.settings) {
    let settings;
    try {
      settings = JSON.parse(serverPage.settings);
    } catch (e) {}
    if (settings) {
      page.settings = settings;
    }
  }
  if (serverPage.author) {
    let author;
    try {
      author = JSON.parse(serverPage.author);
    } catch (e) {}
    if (author) {
      page.author = author;
    }
  }
  if (serverPage.tags) {
    let tags;
    try {
      tags = JSON.parse(serverPage.tags);
    } catch (e) {}
    if (tags) {
      page.tags = tags;
    }
  }
  return Promise.resolve(page);
};

export { findComponents, getComponents, getPageData };
