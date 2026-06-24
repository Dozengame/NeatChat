import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router";
import { IconButton } from "./button";
import GithubIcon from "../icons/github.svg";
import ReloadButtonIcon from "../icons/reload.svg";
import Locale from "../locales";
import { showToast } from "./ui-lib-actions";
import { ApiPath, REPO_URL } from "@/app/constant";
import { Loading } from "./loading";
import styles from "./artifacts.module.scss";
import { ArtifactsShareButton } from "./artifacts-share-button";
import { HTMLPreview, HTMLPreviewHander } from "./artifacts-preview";

async function loadArtifactContent(id: string) {
  const res = await fetch(`${ApiPath.Artifacts}?id=${id}`);
  if (res.status > 300) {
    throw Error("can not get content");
  }
  return res.text();
}

export function Artifacts() {
  const { id } = useParams();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [fileName, setFileName] = useState("");
  const previewRef = useRef<HTMLPreviewHander>(null);

  useEffect(() => {
    if (id) {
      loadArtifactContent(id)
        .then(setCode)
        .catch(() => {
          showToast(Locale.Export.Artifacts.Error);
        });
    }
  }, [id]);

  return (
    <div className={styles["artifacts"]}>
      <div className={styles["artifacts-header"]}>
        <div className={styles["artifacts-header-actions"]}>
          <a
            className={styles["artifacts-header-link"]}
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={Locale.Export.Artifacts.GitHubTitle}
            title={Locale.Export.Artifacts.GitHubTitle}
          >
            <IconButton
              bordered
              icon={<GithubIcon />}
              shadow
              title={Locale.Export.Artifacts.GitHubTitle}
              aria={Locale.Export.Artifacts.GitHubTitle}
            />
          </a>
          <IconButton
            bordered
            className={styles["artifacts-action-button"]}
            icon={<ReloadButtonIcon />}
            shadow
            title={Locale.Export.Artifacts.ReloadTitle}
            aria={Locale.Export.Artifacts.ReloadTitle}
            onClick={() => previewRef.current?.reload()}
          />
        </div>
        <div className={styles["artifacts-title"]}>NeatChat Artifacts</div>
        <div className={styles["artifacts-header-actions"]}>
          <ArtifactsShareButton
            id={id}
            getCode={() => code}
            fileName={fileName}
          />
        </div>
      </div>
      <div className={styles["artifacts-content"]}>
        {loading && <Loading />}
        {code && (
          <HTMLPreview
            code={code}
            ref={previewRef}
            autoHeight={false}
            height={"100%"}
            onLoad={(title) => {
              setFileName(title as string);
              setLoading(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
