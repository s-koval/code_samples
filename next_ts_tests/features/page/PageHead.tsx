import Head from 'next/head';
import { FC, memo, useContext, useEffect, useMemo, useState } from 'react';

import { createSpeakableSchemaScript } from '@/helpers/google-schema';
import usePageImageAndSummary from '@/hooks/usePageImageAndSummary';
import usePageTitle from '@/hooks/usePageTitle';
import { PageLayoutContext } from '@/layouts/PageLayout';
import { PublicSettings, settingsState } from '@/store/reducers/settingsSlice';
import { useAppSelector } from '@/store/store';
import { PageType } from '@/types';

const PageHead: FC = () => {
  const { body, title, type, settings, createdOn, modifiedOn, author } = useContext(PageLayoutContext);
  const websiteSettings = useAppSelector(settingsState);
  const pageImageAndSummary = usePageImageAndSummary(body);
  const pageTitle = usePageTitle(settings?.meta?.title ?? title);
  const [speakableSchemaScriptContent, setSpeakableSchemaScriptContent] = useState<object | undefined>(undefined);
  const pageDescription = useMemo<string | undefined>(
    () =>
      pageImageAndSummary?.summary ??
      settings?.meta?.description ??
      websiteSettings?.data?.seo?.[PublicSettings.META_DESCRIPTION],
    [pageImageAndSummary.summary, settings?.meta?.description, websiteSettings?.data?.seo]
  );
  const pageImage = useMemo<string | undefined>(
    () =>
      pageImageAndSummary?.image?.url ??
      settings?.meta?.image ??
      websiteSettings?.data?.seo?.[PublicSettings.META_IMAGE],
    [pageImageAndSummary.image, settings?.meta?.image, websiteSettings?.data?.seo]
  );

  useEffect(() => {
    const siteLogo = websiteSettings?.data?.general?.[PublicSettings.WEBSITE_LOGO];
    if (siteLogo && typeof siteLogo !== 'undefined') {
      const imgForSpeakable = new Image();
      imgForSpeakable.onload = () => {
        setSpeakableSchemaScriptContent(
          createSpeakableSchemaScript(
            title ?? pageTitle,
            pageDescription,
            type,
            createdOn,
            modifiedOn,
            pageImage,
            imgForSpeakable,
            author?.fullName
          )
        );
      };
      imgForSpeakable.onerror = () => {
        setSpeakableSchemaScriptContent(
          createSpeakableSchemaScript(
            title ?? pageTitle,
            pageDescription,
            type,
            createdOn,
            modifiedOn,
            pageImage,
            undefined,
            author?.fullName
          )
        );
      };
      imgForSpeakable.src = siteLogo;
    } else {
      setSpeakableSchemaScriptContent(
        createSpeakableSchemaScript(
          title ?? pageTitle,
          pageDescription,
          type,
          createdOn,
          modifiedOn,
          pageImage,
          undefined,
          author?.fullName
        )
      );
    }
  }, [
    author?.fullName,
    createdOn,
    modifiedOn,
    pageDescription,
    pageImage,
    pageTitle,
    title,
    type,
    websiteSettings?.data?.general
  ]);

  useEffect(() => {
    const existingScript = document.getElementById('speakableSchemaScript') as HTMLScriptElement;
    if (existingScript) {
      existingScript.remove();
    }
    const speakableSchemaScript = document.createElement('script');
    speakableSchemaScript.type = 'application/ld+json';
    speakableSchemaScript.id = 'speakableSchemaScript';
    speakableSchemaScript.appendChild(document.createTextNode(JSON.stringify(speakableSchemaScriptContent)));
    document.head.appendChild(speakableSchemaScript);
    return () => {
      document.getElementById('speakableSchemaScript')?.remove();
    };
  }, [speakableSchemaScriptContent]);

  useEffect(() => {
    const siteLogo = websiteSettings?.data?.general?.[PublicSettings.WEBSITE_LOGO];
    const existingScript = document.getElementById('logoSchemaScript') as HTMLScriptElement;
    if (existingScript) {
      existingScript.remove();
    }
    const logoSchemaScript = document.createElement('script');
    const json = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      url: location.origin,
      logo: siteLogo ? `${location.origin}/${siteLogo}` : `${location.origin}/images/logo.svg`
    };
    logoSchemaScript.type = 'application/ld+json';
    logoSchemaScript.appendChild(document.createTextNode(JSON.stringify(json)));
    logoSchemaScript.id = 'logoSchemaScript';
    document.head.appendChild(logoSchemaScript);
    return () => {
      document.getElementById('logoSchemaScript')?.remove();
    };
  }, [websiteSettings?.data?.general]);

  return (
    <Head>
      {/* SEO Tags start */}
      {websiteSettings?.data?.seo?.[PublicSettings.CAN_INDEX] ? (
        <meta name="robots" content="index, follow" />
      ) : (
        <meta name="robots" content="noindex, nofollow" />
      )}
      <title>{pageTitle}</title>
      <meta property="og:title" content={pageTitle} />
      <meta property="twitter:title" content={pageTitle} />
      <meta property="og:type" content={type === PageType.PAGE ? 'page' : 'article'} />
      <meta itemProp="name" content={pageTitle} />
      {pageDescription && (
        <>
          <meta name="description" content={pageDescription} />
          <meta property="og:description" content={pageDescription} />
          <meta property="twitter:description" content={pageDescription} />
          <meta itemProp="description" content={pageDescription} />
        </>
      )}
      {pageImage && (
        <>
          <meta property="og:image" content={pageImage} />
          <meta property="twitter:image" content={pageImage} />
          <meta itemProp="image" content={pageImage} />
        </>
      )}
      {/* SEO Tags end */}
    </Head>
  );
};

export default memo(PageHead);
