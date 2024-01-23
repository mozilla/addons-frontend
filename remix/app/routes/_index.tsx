import type { MetaFunction } from "@remix-run/node";
import { useTranslation } from "react-i18next";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function Index() {
  let { t } = useTranslation();
  const text = t('hello-user', {userName: 'Banana'});
  return <h1>{text}</h1>;
}
