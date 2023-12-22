import { ParsedUrlQuery } from 'querystring';

import { Components } from '@/layouts/PageLayout';
import { PageType } from '@/types';

export interface ServerPage extends Omit<PageInterface, 'tags' | 'template' | 'settings' | 'author'> {
  template: string | null;
  settings: string | null;
  author: string;
  tags: string;
}

export interface PageWithComponentsStyles extends PageInterface {
  components: Components;
}

export interface PageParams extends ParsedUrlQuery {
  alias: string[];
}

export type PageTemplate = {
  rawBody: string;
  compiledStyles: string;
};

export type PageTag = {
  id: string;
  name: string;
  category: string;
  uri: string;
  synonyms: string[];
};

export interface PageMeta {
  title?: string;
  description?: string;
  image?: string;
}

export interface PageSettings {
  meta?: PageMeta;
}

export interface PageAuthor {
  fullName: string | null;
  biography: string | null;
  image: string | null;
}

export type PageInterface = {
  id: string;
  title: string;
  alias: string;
  body: string;
  rawBody: string;
  tags: PageTag[];
  template: PageTemplate | null;
  settings?: PageSettings | null;
  type: PageType;
  createdOn: string;
  modifiedOn: string;
  author: PageAuthor | null;
};
