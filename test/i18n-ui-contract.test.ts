import fs from "fs";
import path from "path";

const read = (file: string) =>
  fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("English UI localization contract", () => {
  test.each([
    [
      "app/components/settings.tsx",
      [
        "<p>所有设置选项</p>",
        'title="常规偏好"',
        'title="对话体验"',
        'title="数据"',
        'title="模型"',
        'title="高级偏好"',
      ],
    ],
    [
      "app/components/model-config.tsx",
      [
        'low: "简洁"',
        'medium: "适中"',
        'high: "详细"',
        'title="图像尺寸"',
        'title="图像质量"',
        'title="回答详细程度 (text.verbosity)"',
        "控制 Responses API 的回答详略",
      ],
    ],
    [
      "app/components/chat.tsx",
      [
        'aria-label="多模态工具"',
        "<span>添加内容</span>",
        "<span>文件和图片</span>",
        'text={"上传附件"}',
        'aria-label="会话工具"',
        "<span>模型和设置</span>",
        'aria-label="关闭对话工具"',
        'aria-label="选择模型和参数"',
        'aria-label="关闭模型选择"',
        'aria-label="模型和思考等级"',
        "<strong>思考等级</strong>",
        "<strong>图片尺寸</strong>",
        "<strong>图片清晰度</strong>",
        'aria-label="对话工具菜单"',
        'aria-label="当前输入模式"',
        "<span>图片生成</span>",
        'aria-label="附件预览"',
        'aria-label="关闭预览"',
        'title="关闭预览"',
        'showToast("图片生成未启用")',
        'showToast("该项已由管理员锁定")',
        'showToast("读取拖拽附件失败")',
        'showToast("读取粘贴附件失败")',
        'showToast("读取文件失败")',
        "Locale.Context.Clear}，${Locale.Context.Revert",
        "messageActionLabel}：",
      ],
    ],
    [
      "app/components/image-editor.tsx",
      [
        'props.title ?? "编辑图片"',
        'text="撤销"',
        'text="重做"',
        'aria-label="图片编辑工具"',
        'aria-label="绘图工具"',
        'aria-label="画笔工具"',
        'aria-label="橡皮擦"',
        'aria-label="颜色"',
        'aria-label="笔刷大小"',
      ],
    ],
    [
      "app/components/markdown.tsx",
      [
        'aria-label="Markdown 表格，可横向滚动"',
        'kind === "audio" ? "音频" : "视频"',
        "暂时无法预览，可打开原文件查看",
        "打开原文件",
        'params.get("type") || "未知类型"',
        'showToast("文件内容已复制到剪贴板")',
        'showToast("复制文件内容失败")',
        "文件附件加载失败",
        '"Token 信息"',
      ],
    ],
    [
      "app/components/file-attachment.tsx",
      ["文件附件：", "点击复制文件内容", "类型 ${fileType}，大小"],
    ],
    ["app/components/home.tsx", ['aria-label="关闭侧边栏"']],
    ["app/components/sidebar.tsx", ['"展开栏"', '"折叠栏"']],
    ["app/components/ui-lib-components.tsx", ['placeholder="搜索模型"']],
    [
      "app/components/update-announcement.tsx",
      ["更新内容`,", 'text="我知道了"', 'aria="我知道了"'],
    ],
    [
      "app/utils/file.ts",
      [
        'const DRAG_ATTACHMENT_ADD_HINT = "释放后添加到输入框',
        'const DRAG_ATTACHMENT_BLOCKED_HINT = "释放后不会添加新附件"',
        'blockedParts.push("图片已达 3 张上限")',
        'blockedParts.push("文件已达 5 个上限")',
        'text: "释放后识别附件"',
        "acceptedParts.push(`${acceptedImageCount} 张图片`)",
        "acceptedParts.push(`${acceptedFileCount} 个文件`)",
        '? `将添加 ${acceptedParts.join("、")}，其余会自动忽略`',
        'title: "检测到旧版 Word 文档"',
        'title: "检测到旧版 PowerPoint 文档"',
        'title: "检测到旧版 Excel 文档"',
        'title: "PDF 内容提取受限"',
        'title: "ZIP 文件内容提取受限"',
        'throw new Error("不支持的文件类型")',
        'name: file.name || "粘贴的文件.txt"',
        'showToast(`${file.name || "该文件"} 类型不支持`)',
        "showToast(`读取文件 ${file.name} 失败:",
        'onError(new Error("没有成功读取任何文件"))',
      ],
    ],
    [
      "app/utils/image-action-labels.ts",
      ["预览图片", "下载图片原图", "图片预览：", "第 ${index + 1} 张图片"],
    ],
    ["app/client/platforms/openai-responses-tools.ts", ["来源："]],
    ["app/client/platforms/openai.ts", ["正在推理..."]],
    ["app/api/auth.ts", ["当前访问暂时受限，请稍后再试。"]],
    ["app/api/abuse-control.ts", ["当前访问暂时受限，请稍后再试。"]],
    [
      "app/utils/openai-image.ts",
      ["模型：", "正在保存图片", "正在生成图片", "正在准备图片生成请求"],
    ],
    [
      "app/store/chat.ts",
      [
        'showToast("图片生成失败")',
        "当前进度：",
        "结果查询超时，请稍后重试",
        "任务提交或查询失败，请稍后重试",
      ],
    ],
  ] as Array<[string, string[]]>)(
    "%s routes production copy through Locale",
    (file, forbidden) => {
      const source = read(file);
      for (const literal of forbidden) {
        expect(source).not.toContain(literal);
      }
    },
  );

  test("keeps matching typed locale groups in Chinese and English", () => {
    const cn = read("app/locales/cn.ts");
    const en = read("app/locales/en.ts");
    const requiredGroups = [
      "Sections",
      "ChatToolMenu",
      "Attachments",
      "ImageGeneration",
      "ImageActions",
      "ImageEditor",
      "Markdown",
      "FileAttachment",
      "Reader",
      "UpdateAnnouncement",
    ];

    for (const locale of [cn, en]) {
      for (const group of requiredGroups) {
        expect(locale).toContain(group);
      }
    }
    expect(en).not.toContain("chats，");
    expect(en).not.toContain("disable？");
  });

  test("maps stable public error codes through the active locale", () => {
    const openAIClient = read("app/client/platforms/openai.ts");

    expect(openAIClient).toMatch(
      /isAccessRestrictedPublicError\(res\)[\s\S]*?return Locale\.Error\.AccessRestricted;/,
    );

    const providerClients = [
      "alibaba",
      "baidu",
      "bytedance",
      "glm",
      "google",
      "iflytek",
      "moonshot",
      "tencent",
      "xai",
    ];
    for (const provider of providerClients) {
      const source = read(`app/client/platforms/${provider}.ts`);
      expect(source).toContain("getAccessRestrictedPublicErrorMessage");
      expect(source).toContain("Locale.Error.AccessRestricted");
    }
  });
});
