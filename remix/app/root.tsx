import { cssBundleHref } from "@remix-run/css-bundle";
import type { LinksFunction } from "@remix-run/node";
import { useChangeLanguage } from "remix-i18next";
import { useTranslation } from "react-i18next";
import {LoaderFunctionArgs, json} from '@remix-run/node';
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";

import i18next from "~/i18n/i18next-ftl.server";
import { NAMESPACES } from "./i18n/config";
import { useState } from "react";

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const jsEnabled = !!url.searchParams.get("jsEnabled");
  let locale = await i18next.getLocale(request);
  return json({ locale, jsEnabled});
}

export let handle = {
  i18n: NAMESPACES.amo,
};

export default function Root() {
  const [count, setCount] = useState(0);
  let { locale, jsEnabled } = useLoaderData<typeof loader>();

  let { i18n } = useTranslation();

  useChangeLanguage(locale);

  function increment() {
    console.log("increment");
    setCount((c) => c + 1);
  }

  return (
    <html lang={locale} dir={i18n.dir()}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div>
          <button onClick={increment}>Count {count}</button>
        </div>
        <Outlet />
        <ScrollRestoration />
        {jsEnabled && <Scripts />}
        <LiveReload />
      </body>
    </html>
  );
}
