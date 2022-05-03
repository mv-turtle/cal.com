import { ClipboardCopyIcon } from "@heroicons/react/solid";
import { ApiKeyType } from "@prisma/client";
import { Trans } from "next-i18next";
import Link from "next/link";
import { useState } from "react";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import showToast from "@calcom/lib/notification";
import { Button } from "@calcom/ui";
import Loader from "@calcom/web/components/Loader";
import { Tooltip } from "@calcom/web/components/Tooltip";

import Icon from "./icon";

interface IZapierSetupProps {
  trpc: any;
}

export default function ZapierSetup(props: IZapierSetupProps) {
  const { trpc } = props;
  const [newApiKey, setNewApiKey] = useState("");
  const { t } = useLocale();
  const utils = trpc.useContext();
  const integrations = trpc.useQuery(["viewer.integrations"]);
  const oldApiKey = trpc.useQuery(["viewer.apiKeys.findKeyOfType", { apiKeyType: ApiKeyType.ZAPIER }]);
  const deleteApiKey = trpc.useMutation("viewer.apiKeys.delete");
  const zapierCredentials: { credentialIds: number[] } | undefined = integrations.data?.other?.items.find(
    (item: { type: string }) => item.type === "zapier_other"
  );
  const [credentialId] = zapierCredentials?.credentialIds || [false];
  const showContent = integrations.data && integrations.isSuccess && credentialId;

  async function createApiKey() {
    const event = { note: "Zapier", expiresAt: null, apiKeyType: ApiKeyType.ZAPIER };
    const apiKey = await utils.client.mutation("viewer.apiKeys.create", event);
    if (oldApiKey.data) {
      deleteApiKey.mutate({
        id: oldApiKey.data.id,
      });
    }
    setNewApiKey(apiKey);
  }

  if (integrations.isLoading) {
    return (
      <div className="absolute z-50 flex h-screen w-full items-center bg-gray-200">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-200">
      {showContent ? (
        <div className="m-auto rounded bg-white p-10">
          <div className="flex flex-row">
            <div className="mr-5">
              <Icon />
            </div>
            <div className="ml-5">
              <div className="text-gray-600">{t("setting_up_zapier")}</div>
              {!newApiKey ? (
                <>
                  <div className="mt-1 text-xl">{t("generate_api_key")}:</div>
                  <Button onClick={() => createApiKey()} className="mt-4 mb-4">
                    {t("generate_api_key")}
                  </Button>
                </>
              ) : (
                <>
                  <div className="mt-1 text-xl">{t("your_unique_api_key")}</div>
                  <div className="my-2 mt-3 flex">
                    <div className="mr-1 w-full rounded bg-gray-100 p-3 pr-5">{newApiKey}</div>
                    <Tooltip content="copy to clipboard">
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(newApiKey);
                          showToast(t("api_key_copied"), "success");
                        }}
                        type="button"
                        className="px-4 text-base ">
                        <ClipboardCopyIcon className="mr-2 h-5 w-5 text-neutral-100" />
                        {t("copy")}
                      </Button>
                    </Tooltip>
                  </div>
                  <div className="mt-2 mb-5 text-sm font-semibold text-gray-600">
                    {t("copy_safe_api_key")}
                  </div>
                </>
              )}

              <ol className="mt-5 mb-5 mr-5 list-decimal">
                <Trans i18nKey="zapier_setup_instructions">
                  <li>Log into your Zapier account and create a new Zap.</li>
                  <li>Select Cal.com as your Trigger app. Also choose a Trigger event.</li>
                  <li>Choose your account and then enter your Unique API Key.</li>
                  <li>Test your Trigger.</li>
                  <li>You&apos;re set!</li>
                </Trans>
              </ol>
              <Link href={"/apps/installed"} passHref={true}>
                <Button color="secondary">{t("done")}</Button>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 ml-5">
          <div>{t("install_zapier_app")}</div>
          <div className="mt-3">
            <Link href={"/apps/zapier"} passHref={true}>
              <Button>{t("go_to_app_store")}</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
