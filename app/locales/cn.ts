import { getClientConfig } from "../config/client";
import { SubmitKey } from "../store/config";

const isApp = !!getClientConfig()?.isApp;

const cn = {
  WIP: "该功能仍在开发中……",
  Error: {
    Unauthorized: isApp
      ? "访问密码无效，请重新输入。"
      : "访问密码无效，请重新输入。",
    AccessRestricted: "当前访问暂时受限，请稍后再试。",
  },
  Auth: {
    Return: "返回",
    Title: "需要密码",
    Tips: "管理员开启了密码验证，请在下方填入访问码",
    Input: "在此处填写访问码",
    Confirm: "确认",
    Validating: "验证中…",
    Invalid: "访问码不正确，请重新输入",
    RateLimited: "尝试次数过多，请稍后再试",
    Later: "稍后再说",
  },
  ChatItem: {
    ChatItemCount: (count: number) => `${count} 条对话`,
  },
  Chat: {
    SubTitle: (count: number) => `共 ${count} 条对话`,
    EditMessage: {
      Title: "编辑消息记录",
      Topic: {
        Title: "聊天主题",
        SubTitle: "更改当前聊天主题",
      },
    },
    Actions: {
      ChatList: "查看消息列表",
      CompressedHistory: "查看压缩后的历史 Prompt",
      Export: "导出聊天记录",
      Copy: "复制",
      Stop: "停止",
      Retry: "重试",
      RetryToolTraceBlocked:
        "工具可能已经执行。为避免重复操作，请发送一条新消息继续。",
      Pin: "固定",
      PinToastContent: "已将 1 条对话固定至预设提示词",
      PinToastAction: "查看",
      Delete: "删除",
      Edit: "编辑",
      FullScreen: "全屏",
      RefreshTitle: "刷新标题",
      RefreshToast: "已发送刷新标题请求",
      Speech: "朗读",
      StopSpeech: "停止",
    },
    Commands: {
      new: "新建聊天",
      newm: "从面具新建聊天",
      next: "下一个聊天",
      prev: "上一个聊天",
      clear: "清除上下文",
      fork: "复制聊天",
      del: "删除聊天",
    },
    InputActions: {
      Stop: "停止响应",
      ToBottom: "滚到最新",
      Theme: {
        auto: "自动主题",
        light: "亮色模式",
        dark: "深色模式",
      },
      Prompt: "快捷指令",
      Masks: "所有面具",
      Clear: "清除上下文",
      Settings: "对话设置",
      UploadImage: "上传图片",
    },
    Rename: "重命名对话",
    Typing: "正在输入…",
    EmptyTitle: "你好！想聊点什么？",
    EmptySuggestions: [
      "总结这段内容",
      "帮我规划今天的任务",
      "生成一张产品海报",
      "分析这份文件",
    ] as string[],
    EmptySuggestionTitles: [
      "总结文本",
      "规划日程",
      "创意绘图",
      "分析文档",
    ] as string[],
    HomeMode: {
      Label: "新聊天模式",
      Chat: "聊天",
      Image: "生图",
    },
    Input: (submitKey: string) => {
      var inputHints = `${submitKey} 发送`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += "，Shift + Enter 换行";
      }
      return inputHints;
    },
    MobileInput: "输入消息...",
    Send: "发送",
    StartSpeak: "说话",
    StopSpeak: "停止",
    Config: {
      Reset: "清除记忆",
      SaveAs: "存为面具",
    },
    IsContext: "预设提示词",
    ShortcutKey: {
      Title: "键盘快捷方式",
      newChat: "打开新聊天",
      focusInput: "聚焦输入框",
      copyLastMessage: "复制最后一个回复",
      copyLastCode: "复制最后一个代码块",
      showShortcutKey: "显示快捷方式",
    },
    TokenInfo: {
      TokenCount: (count: number) => `${count} Tokens`,
      FirstDelay: (delay: number) => `首字延迟: ${delay}ms`,
      Label: (details?: string) =>
        details ? `Token 信息，${details}` : "Token 信息",
    },
    SourcesHeading: "来源",
    ChatToolMenu: {
      MultimodalTools: "多模态工具",
      AddContent: "添加内容",
      FilesAndImages: "文件和图片",
      Capacity: "3 图 · 5 文件",
      Full: "已满",
      UploadAttachment: "上传附件",
      AttachmentFull: "附件已满：最多 3 张图片、5 个文件",
      ImageGeneration: "图片生成",
      DisableImageGeneration: "关闭图片生成",
      SessionTools: "会话工具",
      Session: "会话",
      ModelsAndSettings: "模型和设置",
      Close: "关闭对话工具",
      Open: "打开对话工具",
      MenuLabel: "对话工具菜单",
    },
    Attachments: {
      TextConverted: "文本过长，已自动转换为文件附件",
      ContentTruncated: (limit: number) =>
        `文件内容过大，已截断至 ${limit} 字符`,
      AddedFiles: (count: number) => `已添加 ${count} 个文件`,
      MaxFiles: "最多只能上传5个文件，已保留前5个",
      FileSlotsFull: "最多只能上传5个文件",
      AddedImages: (count: number) => `已添加 ${count} 张图片`,
      MaxImages: "最多只能上传3张图片，已保留前3张",
      ImageSlotsFull: "最多只能上传3张图片",
      FileTooLarge: (name: string) => `文件 ${name} 超过 15MB 限制，已忽略`,
      DragReadFailed: "读取拖拽附件失败",
      PasteReadFailed: "读取粘贴附件失败",
      FileReadFailed: "读取文件失败",
      LongTextConverted: "已将长文本转为附件",
      InputTextFile: (timestamp?: string) =>
        `输入文本${timestamp ? `_${timestamp}` : ""}.txt`,
      LongTextFile: "长文本.txt",
      PastedTextFile: "粘贴的文本.txt",
      LongTextMessage: "我发送了一个长文本文件，内容已自动转换为附件。",
      FileMetadata: {
        Name: "文件名",
        Type: "类型",
        Size: "大小",
      },
      JoinMessages: (messages: string[]) => messages.join("，"),
      LiveStatus: (text: string, hint: string) => `${text}，${hint}。`,
      Full: "附件已满：最多 3 张图片、5 个文件",
      DropTitle: "拖拽文件或图片到此处上传",
      DropDetect: "检测拖拽附件",
      Preview: "附件预览",
      AddMore: "继续添加附件",
      FullShort: "已满",
      EditImage: (index: number) => `编辑第 ${index} 张图片附件`,
      DeleteImage: (index: number) => `删除第 ${index} 张图片附件`,
      EditFile: (index: number, name: string) =>
        `编辑第 ${index} 个文件附件：${name}`,
      EditFileContent: (name: string) => `编辑文件内容: ${name}`,
      DeleteFile: (index: number, name: string) =>
        `删除第 ${index} 个文件附件：${name}`,
      Reader: {
        UnknownError: "未知错误",
        UnsupportedFileType: "不支持的文件类型",
        UnsupportedFile: (name: string) => `${name || "该文件"} 类型不支持`,
        PastedFileName: "粘贴的文件.txt",
        ReadFailed: (name: string, error: string) =>
          `读取文件 ${name} 失败：${error}`,
        NoFilesRead: "没有成功读取任何文件",
        TextFileType: "文本文件",
        ContentTruncated: (length: number) =>
          `[文件过大，已截断。原文件大小：${length} 字符]`,
        ImageLoadFailed: "图片加载失败",
        Legacy: {
          Title: (name: string) => `检测到旧版 ${name} 文档`,
          Description: (extension: string) =>
            `您上传的是旧版 ${extension} 格式文件，无法完全解析其内容。`,
          ConvertIntro: "为获得最佳效果，请按照以下步骤转换文件：",
          OpenWith: (app: string) => `使用 ${app} 打开文件`,
          SaveAs: "点击“文件” > “另存为”",
          ChooseFormat: (format: string) => `选择“${format}”格式`,
          SaveAndUpload: "保存并上传新文件",
          PartialTextAttempt: "将尝试提取部分文本内容，但效果可能不理想。",
          PartialTableAttempt: "将尝试提取表格内容，但效果可能不理想。",
          Warning: (extension: string, target: string) =>
            `【注意】此文件为旧版 ${extension} 格式，文本提取可能不完整。为获得最佳效果，请将文件转换为 ${target} 格式后再上传。`,
          CannotFullyRead: (extension: string, target: string) =>
            `【无法读取】此文件为旧版 ${extension} 格式，无法完全解析其内容。请将文件转换为 ${target} 格式后再上传，或复制文件内容后直接粘贴。`,
          CannotRead: (extension: string, target: string) =>
            `【无法读取】此文件为旧版 ${extension} 格式，无法解析其内容。请将文件转换为 ${target} 格式后再上传，或复制文件内容后直接粘贴。`,
          FormatErrorTitle: "文件格式错误",
          FormatErrorDescription: "无法读取此文件，可能是格式不正确或已损坏。",
          ConvertDoc: "如果这是 .doc 格式文件，请按照以下步骤转换：",
          FormatErrorMessage:
            "文件格式不正确或已损坏。如果是 .doc 格式，请转换为 .docx 格式后再上传。",
        },
        Word: {
          Name: "Word",
          App: "Microsoft Word 或 WPS",
          Format: "Word 文档 (.docx)",
        },
        PowerPoint: {
          Name: "PowerPoint",
          App: "PowerPoint 或 WPS 演示",
          Format: "PowerPoint 演示文稿 (.pptx)",
          Slide: (number: number, text: string) =>
            `--- 幻灯片 ${number} ---\n${text}`,
          Content: (slides: string) => `PowerPoint 演示文稿内容：\n\n${slides}`,
          ExtractionFailed:
            "【提取失败】无法从 PowerPoint 文件中提取文本内容。可能是文件格式不支持或不包含文本。",
          ParseFailed:
            "【提取失败】无法解析 PowerPoint 文件内容。请尝试将重要内容复制后直接粘贴。",
        },
        Pdf: {
          Content: (pages: number) => `PDF 文档内容（共 ${pages} 页）：\n\n`,
          UnreadablePage: "[无法解析此页]",
          BlankPage: "[空白或图像内容]",
          Page: (number: number, text: string) =>
            `--- 第 ${number} 页 ---\n${text}\n\n`,
          Truncated: (processed: number, total: number) =>
            `\n[文件过大，仅处理了前 ${processed} 页。总页数：${total}]\n`,
          LimitedTitle: "PDF 内容提取受限",
          LimitedDescription: "无法从 PDF 提取文本内容，可能是以下原因：",
          Scanned: "PDF 是扫描版（图像而非文本）",
          Protected: "PDF 使用了内容保护或加密",
          Damaged: "PDF 格式特殊或已损坏",
          Suggestions: "建议：",
          UseOcr: "使用 OCR 软件处理此 PDF",
          CopyManually: "手动复制需要的内容后粘贴",
          UseSmallerFile: "尝试使用较小的 PDF 文件",
          LimitedContent: (name: string, sizeMb: string, pages: number) =>
            `【PDF 内容提取受限】\n\n此 PDF 文件（${name}）无法提取文本内容，可能是扫描版或受保护的 PDF。\n\n文件信息：\n- 大小：${sizeMb} MB\n- 页数：${pages} 页\n\n建议使用 OCR 软件处理此文件，或手动复制需要的内容。`,
          ParseFailedTitle: "PDF 解析失败",
          ParseFailedDescription: "无法解析 PDF 文件内容。",
          Error: (message: string) => `错误信息：${message}`,
          ParseFailedHelp:
            "请尝试使用其他 PDF 查看器打开文件，然后复制内容后直接粘贴。",
          ParseFailedContent:
            "【PDF 解析失败】无法提取 PDF 文件内容。请尝试使用 PDF 查看器打开文件，然后复制内容后直接粘贴。",
        },
        Zip: {
          BinaryFile: (size: number) => `[二进制文件，大小：${size} 字节]`,
          UnreadableFile: "[无法读取此文件]",
          Content: (name: string) => `ZIP 文件内容（${name}）：\n`,
          TotalFiles: (count: number) => `总文件数：${count}`,
          ShowingFirst: (count: number) => `（仅显示前 ${count} 个文件）`,
          TextFiles: (count: number) => `\n文本文件数：${count}\n\n`,
          Truncated: (processed: number, total: number) =>
            `\n[ZIP 文件过大，仅处理了前 ${processed} 个文件。总文件数：${total}]\n`,
          LimitedTitle: "ZIP 文件内容提取受限",
          NoReadableText:
            "此 ZIP 文件不包含可读取的文本文件，或文件格式不受支持。",
          SupportedTextOnly:
            "只能提取常见文本文件的内容，如 .txt、.md、.js、.py 等。",
          ExtractHelp: "建议解压 ZIP 文件后，单独上传需要的文本文件。",
          ParseFailedTitle: "ZIP 解析失败",
          ParseFailedDescription: "无法解析 ZIP 文件内容。",
          ParseFailedHelp:
            "请确保上传的是有效的 ZIP 文件，或尝试解压后单独上传文件。",
          ParseFailedContent:
            "【ZIP 解析失败】无法提取 ZIP 文件内容。请确保上传的是有效的 ZIP 文件，或尝试解压后单独上传文件。",
        },
        Excel: {
          Name: "Excel",
          App: "Microsoft Excel 或 WPS 表格",
          Format: "Excel 工作簿 (.xlsx)",
          Content: (name: string) => `Excel 表格内容（${name}）：\n\n`,
          SheetCount: (count: number) => `工作表数量：${count}\n\n`,
          Sheet: (name: string) => `=== 工作表：${name} ===\n\n`,
          EmptySheet: "[空工作表]\n\n",
          ParseFailedTitle: "Excel 解析失败",
          ParseFailedDescription: "无法解析 Excel 文件内容。",
          ParseFailedHelp:
            "请尝试使用 Excel 打开文件，然后复制内容后直接粘贴。",
          ParseFailedContent:
            "【Excel 解析失败】无法提取 Excel 文件内容。请尝试使用 Excel 打开文件，然后复制内容后直接粘贴。",
        },
      },
      Drag: {
        AddHint: "释放后添加到输入框 · 最多3张图片、5个文件",
        BlockedHint: "释放后不会添加新附件",
        ImageLimit: "图片已达 3 张上限",
        FileLimit: "文件已达 5 个上限",
        Limit: "附件数量已达上限",
        Detect: "释放后识别附件",
        ImageCount: (count: number) => `${count} 张图片`,
        FileCount: (count: number) => `${count} 个文件`,
        WillAdd: (parts: string[], overflow: boolean) =>
          overflow
            ? `将添加 ${parts.join("、")}，其余会自动忽略`
            : `将添加 ${parts.join("、")}`,
      },
    },
    ImageGeneration: {
      NotEnabled: "图片生成未启用",
      EnableFailed: "图片生成启用失败",
      DisableFailed: "图片生成关闭失败",
      Enabled: "已启用图片生成",
      Disabled: "已关闭图片生成",
      Failed: "图片生成失败",
      ModeEnabled: "图片生成模式已开启",
      ModeLabel: "图片生成",
      Task: "图片生成任务",
      Submitting: "正在提交到 jimeng-mcp",
      QueryTimeout: "结果查询超时，请稍后重试",
      SubmitOrQueryFailed: "任务提交或查询失败，请稍后重试",
      Progress: {
        Model: (model: string) => (model ? `\n\n模型：${model}` : ""),
        Preparing: "正在准备图片生成请求...",
        Generating: "正在生成图片，请稍候...",
        Saving: "图片已生成，正在保存图片...",
      },
      Display: {
        Task: "图片生成任务",
        ToolCall: "工具调用",
        GenerationType: "生成类型：",
        OptimizedPrompt: "优化后的 Prompt：",
        Parameters: "参数：",
        Progress: "当前进度：",
        Status: "状态：",
        Submitting: "正在提交到 jimeng-mcp",
        PreparingTool: "正在准备执行工具",
        PreparingSubmission: "正在准备提交到 jimeng-mcp",
        TextToImage: "文生图",
        ImageToImage: "图生图",
        TextToVideo: "文生视频",
        ImageToVideo: "图生视频",
        AspectRatio: "画幅：",
        Resolution: "清晰度：",
        ModelVersion: "模型版本：",
        Duration: "时长：",
        Submitted: "已提交，等待返回状态",
        Success: "生成成功",
        Generating: "生成中",
        Failure: "生成失败",
        Cancelled: "已取消",
        Timeout: "查询超时",
        Unknown: "未知",
      },
    },
    ModelMenu: {
      SelectModel: (model: string, detail: string) =>
        `选择模型：${model}，${detail}`,
      SelectModelAndParams: "选择模型和参数",
      SwitchModel: "切换模型",
      Close: "关闭模型选择",
      ModelAndReasoning: "模型和思考等级",
      ImageOptions: "图片选项",
      AvailableModels: "可选模型",
      Empty: "暂无可用模型",
      ChatModelUnavailable: "暂无可用的 GPT-5.x 聊天模型",
      ImageModelUnavailable: "暂无可用的生图模型",
      ReasoningEffort: "思考等级",
      ReasoningOptions: "思考等级选项",
      ImageSize: "图片尺寸",
      ImageSizeOptions: "图片尺寸选项",
      ImageSizeDescription: (size: string) =>
        size === "auto"
          ? "由模型自动选择合适尺寸"
          : `常用尺寸：${size.replace("x", " × ")}`,
      ImageQuality: "图片清晰度",
      ImageQualityOptions: "图片清晰度选项",
      ImageQualityDescription: (quality: string) =>
        quality === "auto"
          ? "由模型自动平衡速度与细节"
          : quality === "hd"
          ? "使用高清渲染质量"
          : quality === "standard"
          ? "使用标准渲染质量"
          : `使用${
              quality === "high" ? "高" : quality === "medium" ? "中" : "低"
            }清晰度`,
      CurrentInputMode: "当前输入模式",
      SelectedReasoning: (label: string) => `思考等级：${label}`,
      SelectedImageOptions: (summary: string) => `图片选项：${summary}`,
    },
    Accessibility: {
      PromptSuggestions: "提示词建议",
      ChatMessages: "聊天消息",
      SuggestedQuestions: "建议问题",
      MessageList: "会话消息列表",
      UserMessage: (index: number) => `用户消息 ${index}`,
      AssistantMessage: (index: number) => `助手消息 ${index}`,
      MessageActions: (label: string) => `${label} 操作`,
      CombinedLabels: (labels: string[]) => labels.join("，"),
      ActionLabel: (group: string, action: string) => `${group}：${action}`,
    },
  },
  Export: {
    Title: "分享聊天记录",
    Copy: "全部复制",
    Download: "下载文件",
    Share: "分享到 ShareGPT",
    MessageFromYou: "用户",
    MessageFromChatGPT: "ChatGPT",
    Format: {
      Title: "导出格式",
      SubTitle: "可以导出 Markdown 文本或者 PNG 图片",
    },
    IncludeContext: {
      Title: "包含面具上下文",
      SubTitle: "是否在消息中展示面具上下文",
    },
    Steps: {
      Select: "选取",
      Preview: "预览",
    },
    Image: {
      Toast: "正在生成截图",
      Modal: "长按或右键保存图片",
    },
    Artifacts: {
      Title: "分享页面",
      Error: "分享失败",
      GitHubTitle: "打开 GitHub 仓库",
      ReloadTitle: "重新加载预览",
    },
  },
  Select: {
    Search: "搜索消息",
    All: "选取全部",
    Latest: "最近几条",
    Clear: "清除选中",
  },
  Memory: {
    Title: "历史摘要",
    EmptyContent: "对话内容过短，无需总结",
    Send: "自动压缩聊天记录并作为上下文发送",
    Copy: "复制摘要",
    Reset: "[unused]",
    ResetConfirm: "确认清空历史摘要？",
  },
  Home: {
    NewChat: "新的聊天",
    PrimarySection: "开始",
    ContentSection: "内容",
    LocalContent: {
      Title: "本地内容",
      SubTitle: "搜索聊天、文件和生成内容",
    },
    DeleteChat: "确认删除选中的对话？",
    DeleteToast: "已删除会话",
    Revert: "撤销",
  },
  Settings: {
    Title: "设置",
    SubTitle: "所有设置选项",
    ShowPassword: "显示密码",
    Sections: {
      General: {
        Title: "常规偏好",
        Description: "输入方式、主题、语言和字体。",
      },
      Chat: {
        Title: "对话体验",
        Description: "控制聊天标题、预览气泡、Artifacts、代码阅读和会话工具。",
      },
      Data: {
        Title: "数据",
        Description: "云端同步、本地导入导出、面具和提示词。",
      },
      Model: {
        Title: "模型",
        Description: "访问密码、服务来源、模型参数和压缩设置。",
      },
      Advanced: {
        Title: "高级偏好",
        Description: "重置和清除操作。",
      },
    },

    Danger: {
      Reset: {
        Title: "重置所有设置",
        SubTitle: "重置所有设置项回默认值",
        Action: "立即重置",
        Confirm: "确认重置所有设置？",
      },
      Clear: {
        Title: "清除所有数据",
        SubTitle: "清除所有聊天、设置数据",
        Action: "立即清除",
        Confirm: "确认清除所有聊天、设置数据？",
      },
    },
    Lang: {
      Name: "Language", // ATTENTION: if you wanna add a new translation, please do not translate this value, leave it as `Language`
      All: "所有语言",
    },
    FontSize: {
      Title: "字体大小",
      SubTitle: "聊天内容的字体大小",
    },
    FontFamily: {
      Title: "聊天字体",
      SubTitle: "聊天内容的字体，若置空则应用全局默认字体",
      Placeholder: "字体名称",
    },
    InjectSystemPrompts: {
      Title: "注入系统级提示信息",
      SubTitle: "强制给每次请求的消息列表开头添加一个模拟 ChatGPT 的系统提示",
    },
    InputTemplate: {
      Title: "用户输入预处理",
      SubTitle: "用户最新的一条消息会填充到此模板",
    },
    CustomInstructions: {
      Enable: {
        Title: "启用自定义指令",
        SubTitle: "开启后，之后新建的对话都会带上这段要求",
      },
      Content: {
        Title: "自定义指令",
        SubTitle: (count: number) => `${count}/1500`,
        Edit: "全屏编辑",
        Done: "完成",
        Placeholder:
          "写下你希望助手在新对话中始终遵守的要求，例如回答风格、身份背景、输出格式。",
      },
    },

    Update: {
      Version: (x: string) => `当前版本：${x}`,
      IsLatest: "已是最新版本",
      CheckUpdate: "检查更新",
      IsChecking: "正在检查更新...",
      FoundUpdate: (x: string) => `发现新版本：${x}`,
      GoToUpdate: "前往更新",
      Success: "更新成功！",
      Failed: "更新失败",
    },
    SendKey: "发送键",
    Theme: "主题",
    TightBorder: "无边框模式",
    SendPreviewBubble: {
      Title: "预览气泡",
      SubTitle: "在预览气泡中预览 Markdown 内容",
    },
    AutoGenerateTitle: {
      Title: "自动生成标题",
      SubTitle: "根据对话内容生成合适的标题",
    },
    Sync: {
      CloudState: "云端数据",
      NotSyncYet: "还没有进行过同步",
      Success: "同步成功",
      Fail: "同步失败",

      Config: {
        Modal: {
          Title: "配置云同步",
          Check: "检查可用性",
        },
        SyncType: {
          Title: "同步类型",
          SubTitle: "选择喜爱的同步服务器",
        },
        Proxy: {
          Title: "启用代理",
          SubTitle: "在浏览器中同步时，必须启用代理以避免跨域限制",
        },
        ProxyUrl: {
          Title: "代理地址",
          SubTitle: "仅适用于本项目自带的跨域代理",
        },

        WebDav: {
          Endpoint: "WebDAV 地址",
          UserName: "用户名",
          Password: "密码",
        },

        UpStash: {
          Endpoint: "UpStash Redis REST Url",
          UserName: "备份名称",
          Password: "UpStash Redis REST Token",
        },
      },

      LocalState: "本地数据",
      Overview: (overview: any) => {
        return `${overview.chat} 次对话，${overview.message} 条消息，${overview.prompt} 条提示词，${overview.mask} 个面具`;
      },
      ImportFailed: "导入失败",
    },

    Mask: {
      Splash: {
        Title: "面具启动页",
        SubTitle: "新建聊天时，展示面具启动页",
      },
      Builtin: {
        Title: "隐藏内置面具",
        SubTitle: "在所有面具列表中隐藏内置面具",
      },
    },
    Prompt: {
      Disable: {
        Title: "禁用提示词自动补全",
        SubTitle: "在输入框开头输入 / 即可触发自动补全",
      },
      List: "自定义提示词列表",
      ListCount: (builtin: number, custom: number) =>
        `内置 ${builtin} 条，用户定义 ${custom} 条`,
      Edit: "编辑",
      Modal: {
        Title: "提示词列表",
        Add: "新建",
        Search: "搜索提示词",
      },
      EditModal: {
        Title: "编辑提示词",
      },
    },
    HistoryCount: {
      Title: "附带历史消息数",
      SubTitle: "每次请求携带的历史消息数",
    },
    CompressThreshold: {
      Title: "历史消息长度压缩阈值",
      SubTitle: "当未压缩的历史消息超过该值时，将进行压缩",
    },

    Usage: {
      Title: "余额查询",
      SubTitle(used: any, total: any) {
        return `本月已使用 $${used}，订阅总额 $${total}`;
      },
      IsChecking: "正在检查…",
      Check: "重新检查",
      NoAccess: "输入访问密码后查看余额",
    },

    Access: {
      AccessCode: {
        Title: "访问密码",
        SubTitle: "管理员已开启加密访问",
        Placeholder: "请输入访问密码",
      },
      CustomEndpoint: {
        Title: "自定义接口",
        SubTitle: "是否使用自定义 Azure 或 OpenAI 服务",
      },
      Provider: {
        Title: "模型服务商",
        SubTitle: "切换不同的服务商",
      },
      OpenAI: {
        ApiKey: {
          Title: "API Key",
          SubTitle: "使用自定义 OpenAI Key",
          Placeholder: "OpenAI API Key",
        },

        Endpoint: {
          Title: "接口地址",
          SubTitle: "除默认地址外，必须包含 http(s)://",
        },
      },
      Azure: {
        ApiKey: {
          Title: "接口密钥",
          SubTitle: "使用自定义 Azure Key",
          Placeholder: "Azure API Key",
        },

        Endpoint: {
          Title: "接口地址",
          SubTitle: "样例：",
        },

        ApiVerion: {
          Title: "接口版本 (azure api version)",
          SubTitle: "选择指定的部分版本",
        },
      },
      Anthropic: {
        ApiKey: {
          Title: "接口密钥",
          SubTitle: "使用自定义 Anthropic Key",
          Placeholder: "Anthropic API Key",
        },

        Endpoint: {
          Title: "接口地址",
          SubTitle: "样例：",
        },

        ApiVerion: {
          Title: "接口版本 (claude api version)",
          SubTitle: "选择一个特定的 API 版本输入",
        },
      },
      Google: {
        ApiKey: {
          Title: "API 密钥",
          SubTitle: "从 Google AI 获取您的 API 密钥",
          Placeholder: "Google AI API KEY",
        },

        Endpoint: {
          Title: "终端地址",
          SubTitle: "示例：",
        },

        ApiVersion: {
          Title: "API 版本（仅适用于 gemini-pro）",
          SubTitle: "选择一个特定的 API 版本",
        },
        GoogleSafetySettings: {
          Title: "Google 安全过滤级别",
          SubTitle: "设置内容过滤级别",
        },
      },
      Baidu: {
        ApiKey: {
          Title: "API Key",
          SubTitle: "使用自定义 Baidu API Key",
          Placeholder: "Baidu API Key",
        },
        SecretKey: {
          Title: "Secret Key",
          SubTitle: "使用自定义 Baidu Secret Key",
          Placeholder: "Baidu Secret Key",
        },
        Endpoint: {
          Title: "接口地址",
          SubTitle: "不支持自定义前往.env配置",
        },
      },
      Tencent: {
        ApiKey: {
          Title: "API Key",
          SubTitle: "使用自定义腾讯云API Key",
          Placeholder: "Tencent API Key",
        },
        SecretKey: {
          Title: "Secret Key",
          SubTitle: "使用自定义腾讯云Secret Key",
          Placeholder: "Tencent Secret Key",
        },
        Endpoint: {
          Title: "接口地址",
          SubTitle: "不支持自定义前往.env配置",
        },
      },
      ByteDance: {
        ApiKey: {
          Title: "接口密钥",
          SubTitle: "使用自定义 ByteDance API Key",
          Placeholder: "ByteDance API Key",
        },
        Endpoint: {
          Title: "接口地址",
          SubTitle: "样例：",
        },
      },
      Alibaba: {
        ApiKey: {
          Title: "接口密钥",
          SubTitle: "使用自定义阿里云API Key",
          Placeholder: "Alibaba Cloud API Key",
        },
        Endpoint: {
          Title: "接口地址",
          SubTitle: "样例：",
        },
      },
      Moonshot: {
        ApiKey: {
          Title: "接口密钥",
          SubTitle: "使用自定义月之暗面API Key",
          Placeholder: "Moonshot API Key",
        },
        Endpoint: {
          Title: "接口地址",
          SubTitle: "样例：",
        },
      },
      XAI: {
        ApiKey: {
          Title: "接口密钥",
          SubTitle: "使用自定义XAI API Key",
          Placeholder: "XAI API Key",
        },
        Endpoint: {
          Title: "接口地址",
          SubTitle: "样例：",
        },
      },
      ChatGLM: {
        ApiKey: {
          Title: "接口密钥",
          SubTitle: "使用自定义 ChatGLM API Key",
          Placeholder: "ChatGLM API Key",
        },
        Endpoint: {
          Title: "接口地址",
          SubTitle: "样例：",
        },
      },
      Stability: {
        ApiKey: {
          Title: "接口密钥",
          SubTitle: "使用自定义 Stability API Key",
          Placeholder: "Stability API Key",
        },
        Endpoint: {
          Title: "接口地址",
          SubTitle: "样例：",
        },
      },
      Iflytek: {
        ApiKey: {
          Title: "ApiKey",
          SubTitle: "从讯飞星火控制台获取的 APIKey",
          Placeholder: "APIKey",
        },
        ApiSecret: {
          Title: "ApiSecret",
          SubTitle: "从讯飞星火控制台获取的 APISecret",
          Placeholder: "APISecret",
        },
        Endpoint: {
          Title: "接口地址",
          SubTitle: "样例：",
        },
      },
      CustomModel: {
        Title: "自定义模型名",
        SubTitle: "增加自定义模型可选项，使用英文逗号隔开",
        ModelSelector: "选择模型",
        FetchModels: "加载模型列表",
        FetchSuccessFromClient: (count: number) =>
          `成功从客户端配置获取到 ${count} 个模型`,
        FetchSuccessFromServer: (count: number) =>
          `成功从服务端配置获取到 ${count} 个模型`,
        FetchFailedFromClient: (error: string) =>
          `从客户端配置获取模型失败: ${error}`,
        FetchFailedFromServer: (error: string) =>
          `从服务端配置获取模型失败: ${error}`,
        ApiKeyRequired: "请先设置API密钥",
        InvalidResponse: "无效的响应格式",
        RequestFailed: (status: number) => `请求失败: ${status}`,
        InputPlaceholder: "输入自定义模型名称并按回车添加",
        SelectAll: "全选",
        SelectNone: "全不选",
        ModelExists: "模型已存在",
        EditCategories: "编辑模型类别",
        CategoryName: "类别名称",
        MatchKeyword: "匹配关键词",
        AddCategory: "添加",
        CategoryTip:
          '匹配关键词将用于识别模型类别，例如"gpt"将匹配所有包含"gpt"的模型',
        ExistingCategories: "现有自定义类别",
        NoCustomCategories: "暂无自定义类别",
        InputPlaceholderEnter: "输入自定义模型名称并按回车添加",
        RefreshModels: "重新获取模型",
        ModelNameLabel: "模型名称",
        MatchRule: "匹配规则",
        RestoreDefaults: "恢复默认",
        DeleteConfirm: "确认删除此模型?",
        AuthRequired: "请先在设置中输入访问密码",
        SaveEditFailed: "更新本地存储失败",
        DeleteModelSuccess: "已从本地存储中删除模型",
        DeleteModelFailed: "更新本地存储失败",
        ModelNotFound: "找不到要删除的模型",
        ModelNotFoundInList: "在完整模型列表中找不到要删除的模型",
        EditModelNotFound: "找不到要编辑的模型",
        EditModelNotFoundInList: "在完整模型列表中找不到要编辑的模型",
        FetchFailed: "获取模型列表失败",
        RestoreRulesSuccess: "已恢复默认匹配规则",
        RestoreRulesFailed: "恢复默认匹配规则失败",
        MatchPrefix: "匹配",
        ModelCategory: "模型类别",
        ModelCategoryOther: "其他",
        TestModel: "测试模型",
        Testing: "测试中...",
        TestStart: "开始测试 {0} 个模型...",
        TestSuccess: "{0}: 测试成功 ({1}ms)",
        TestFailed: "{0}: 测试失败",
        TestComplete: "测试完成: {0}/{1} 个模型可用",
        TestError: "测试出错: {0}",
        SelectModelsToTest: "请先选择要测试的模型",
        Unavailable: "不可用",
        NoModelsToTest: "当前没有可测试的模型",
        TestButton: "测试",
        TestTimeout: "超时",
        TestUnavailable: "失败",
        TestButtonTooltip: "点击测试此模型",
        RetestButtonTooltip: "点击重新测试此模型",
        TestStartMessage: "开始测试模型: {0}...",
        TestSuccessMessage: "{0}: 测试成功 ({1}s)",
        TestTimeoutMessage: "{0}: 超时",
        TestErrorMessage: "{0}: {1}",
        TestErrorPrefix: "测试出错: ",
        ServerTestFailedError: "服务端测试失败: {0}",
        UpdateStorageFailedError: "更新本地存储失败",
        DefaultTestFailedMessage: "测试失败",
        TestAllModelsStart: "开始测试 {0} 个模型...",
        StopTest: "停止测试",
        TestAll: "全部测试",
        TestStopped: "已停止测试",
        TestCompleteMessage: "测试完成: {0}/{1} 个模型可用",
        TimeoutOptions: {
          FiveSeconds: "5秒",
          SixSeconds: "6秒",
          SevenSeconds: "7秒",
          EightSeconds: "8秒",
          NineSeconds: "9秒",
          TenSeconds: "10秒",
        },
      },
    },

    Model: "模型 (model)",
    ImageGeneration: {
      Size: "图像尺寸",
      Quality: "渲染质量",
      Auto: "自动",
      Low: "低",
      Medium: "中",
      High: "高",
      Standard: "标准",
      HD: "高清",
      SizeLabel: (size: string) =>
        ({
          auto: "自动",
          "1024x1024": "方形 · 1K",
          "1536x1024": "横向 · 1.5K",
          "1024x1536": "纵向 · 1.5K",
          "2048x2048": "方形 · 2K",
          "2048x1152": "横向 · 2K",
          "3840x2160": "横向 · 4K",
          "2160x3840": "纵向 · 4K",
        })[size] ?? size,
      SizeOption: (size: string) => {
        const label =
          {
            auto: "自动",
            "1024x1024": "方形 · 1K",
            "1536x1024": "横向 · 1.5K",
            "1024x1536": "纵向 · 1.5K",
            "2048x2048": "方形 · 2K",
            "2048x1152": "横向 · 2K",
            "3840x2160": "横向 · 4K",
            "2160x3840": "纵向 · 4K",
          }[size] ?? size;
        return size === "auto" ? label : `${label}（${size}）`;
      },
      QualityOption: (quality: string) =>
        ({
          auto: "自动",
          low: "低",
          medium: "中",
          high: "高",
          standard: "标准",
          hd: "高清",
        })[quality] ?? quality,
    },
    TextVerbosity: {
      Title: "回答详细程度 (text.verbosity)",
      SubTitle: "控制 Responses API 的回答详略",
      Low: "简洁",
      Medium: "适中",
      High: "详细",
    },
    CompressModel: {
      Title: "对话摘要模型",
      SubTitle: "用于压缩历史记录、生成对话标题的模型",
    },
    Temperature: {
      Title: "随机性 (temperature)",
      SubTitle: "值越大，回复越随机",
    },
    TopP: {
      Title: "核采样 (top_p)",
      SubTitle: "与随机性类似，但不要和随机性一起更改",
    },
    ReasoningEffort: {
      Title: "思考深度",
      SubTitle: "适用于 GPT-5.x 及以上模型",
      None: "快速",
      Minimal: "最简",
      Low: "低",
      Medium: "中",
      High: "高",
      XHigh: "极高",
      Max: "MAX",
      NoneDescription: "不使用额外推理，优先速度",
      MinimalDescription: "使用最少推理，兼顾速度与基础判断",
      LowDescription: "最适合回答大多数问题",
      MediumDescription: "更稳妥处理复杂任务",
      HighDescription: "用于高难度推理",
      XHighDescription: "用于需要更多探索和校验的任务",
      MaxDescription: "用于最困难且质量优先的任务",
    },
    GPT56Capabilities: {
      ConfigSource: {
        Prefix: "来源：",
        Separator: "。",
        Locked: "该项已由管理员锁定",
        AdminForced: "管理员锁定",
        ServerDefault: "管理员默认",
        UserOverride: "个人设置",
        ConversationOverride: "当前会话",
        Fallback: "系统默认",
      },
      ReasoningMode: {
        Title: "推理模式",
        SubTitle: "Standard 平衡速度与质量；Pro 优先深度推理",
        Standard: "Standard",
        Pro: "Pro",
      },
      ReasoningContext: {
        Title: "推理上下文",
        SubTitle: "控制模型在当前轮或跨轮保留推理上下文",
        Auto: "自动",
        CurrentTurn: "仅当前轮",
        AllTurns: "全部轮次",
      },
      InputImageDetail: {
        Title: "图片理解精度",
        SubTitle: "默认 High，避免 GPT-5.6 Auto 使用 Original 增加成本与延迟",
        Low: "Low",
        High: "High",
        Original: "Original",
        Auto: "Auto",
      },
      PromptCacheMode: {
        Title: "Prompt Cache 模式",
        SubTitle:
          "关闭使用无断点的 Explicit 策略以避免缓存写入；Implicit 自动缓存；Explicit 在最新输入处设置缓存断点",
        Disabled: "关闭",
        Implicit: "Implicit",
        Explicit: "Explicit",
      },
      PromptCacheKey: {
        Title: "Prompt Cache Key",
        SubTitle: "可选路由键；会发送到 OpenAI，请勿填写密钥或个人信息",
      },
    },
    MaxTokens: {
      Title: "输出上限 (max_output_tokens)",
      SubTitle: "单次回复可用的最大输出 Token 数（包含思考）",
    },
    PresencePenalty: {
      Title: "话题新鲜度 (presence_penalty)",
      SubTitle: "值越大，越有可能扩展到新话题",
    },
    FrequencyPenalty: {
      Title: "频率惩罚度 (frequency_penalty)",
      SubTitle: "值越大，越有可能降低重复字词",
    },
    TTS: {
      Enable: {
        Title: "启用文本转语音",
        SubTitle: "启用文本生成语音服务",
      },
      Autoplay: {
        Title: "启用自动朗读",
        SubTitle: "自动生成语音并播放，需先开启文本转语音开关",
      },
      Model: "模型",
      Engine: "转换引擎",
      Voice: {
        Title: "声音",
        SubTitle: "生成语音时使用的声音",
      },
      Speed: {
        Title: "速度",
        SubTitle: "生成语音的速度",
      },
    },
    Realtime: {
      Enable: {
        Title: "实时聊天",
        SubTitle: "开启实时聊天功能",
      },
      Start: "开始语音",
      Pause: "暂停语音",
      Connecting: "正在连接",
      Ready: "语音就绪",
      Listening: "正在聆听",
      Provider: {
        Title: "模型服务商",
        SubTitle: "切换不同的服务商",
      },
      Model: {
        Title: "模型",
        SubTitle: "选择一个模型",
      },
      ApiKey: {
        Title: "API Key",
        SubTitle: "API Key",
        Placeholder: "API Key",
      },
      Azure: {
        Endpoint: {
          Title: "接口地址",
          SubTitle: "接口地址",
        },
        Deployment: {
          Title: "部署名称",
          SubTitle: "部署名称",
        },
      },
      Temperature: {
        Title: "随机性 (temperature)",
        SubTitle: "值越大，回复越随机",
      },
    },
    EnableModelSearch: "启用模型搜索",
    EnableModelSearchSubTitle: "启用之后可以在选择模型时搜索过滤",
    EnableThemeChange: {
      Title: "启用主题切换",
      SubTitle: "是否在对话框中显示主题切换按钮",
    },
    EnablePromptHints: {
      Title: "启用快捷指令功能",
      SubTitle: "开启后可通过 / 触发快捷指令功能，关闭后将完全禁用快捷指令",
    },
    EnableClearContext: {
      Title: "启用清除聊天",
      SubTitle: "是否在对话框中显示清除聊天按钮",
    },
    EnablePlugins: {
      Title: "启用插件",
      SubTitle: "是否在对话框中显示插件按钮",
    },
    EnableShortcuts: {
      Title: "启用快捷键",
      SubTitle: "是否在对话框中显示快捷键按钮",
    },
  },
  ImageActions: {
    Image: "图片",
    Preview: "预览图片",
    Download: "下载图片原图",
    PreviewWithLabel: (label: string) => `预览 ${label}`,
    DownloadWithLabel: (label: string) => `下载 ${label} 原图`,
    PreviewAlt: "图片预览",
    PreviewDialog: "图片预览",
    PreviewDialogWithLabel: (label: string) => `图片预览：${label}`,
    Message: (index: number, total: number) =>
      total > 1 ? `第 ${index} 张图片` : "图片",
    OpenedOriginal: "无法直接保存图片，已打开原图",
    ClosePreview: "关闭预览",
  },
  ImageEditor: {
    Title: "编辑图片",
    Undo: "撤销",
    Redo: "重做",
    Toolbar: "图片编辑工具",
    DrawingTools: "绘图工具",
    Brush: "画笔工具",
    Eraser: "橡皮擦",
    Line: "直线工具",
    Arrow: "箭头工具",
    Rectangle: "矩形工具",
    Circle: "圆形工具",
    Color: "颜色",
    BrushSize: "笔刷大小",
    ChooseColor: (color: string) => `选择颜色 ${color}`,
    ChooseBrushSize: (size: number) => `选择笔刷大小 ${size}`,
  },
  Markdown: {
    CopyCode: (language: string, copied: boolean) =>
      copied
        ? `已复制${language ? ` ${language}` : ""}代码`
        : `复制${language ? ` ${language}` : ""}代码`,
    WrapCode: (language: string, enabled: boolean) =>
      `${enabled ? "关闭" : "开启"}${
        language ? ` ${language}` : ""
      }代码自动换行`,
    ScrollableTable: (headers: string) =>
      headers
        ? `Markdown 表格（${headers}），可横向滚动`
        : "Markdown 表格，可横向滚动",
    ScrollableTableHint: "横向滑动查看更多列",
    ScrollableFormula: "块级公式，可横向滚动",
    HtmlPreview: "HTML 预览",
    Audio: "音频",
    Video: "视频",
    MediaAttachment: (type: string, label: string) => `${type}附件：${label}`,
    MediaFallback: (type: string) => `${type}暂时无法预览，可打开原文件查看。`,
    OpenOriginal: "打开原文件",
    UnknownType: "未知类型",
    FileCopied: "文件内容已复制到剪贴板",
    FileCopyFailed: "复制文件内容失败",
    FileNotFound: "无法找到文件内容",
    FileLoadFailed: "文件附件加载失败",
  },
  FileAttachment: {
    Label: (name: string, type: string, size: string, interactive: boolean) =>
      `文件附件：${name}，${type}，${size}。${
        interactive ? "点击复制文件内容。" : ""
      }`,
    Meta: (type: string, size: string) => `类型 ${type}，大小 ${size}`,
  },
  UpdateAnnouncement: {
    Title: (date: string) => `${date} 更新内容`,
    SectionTitle: "更新",
    Acknowledge: "我知道了",
  },
  Store: {
    DefaultTopic: "新的聊天",
    BotHello: "有什么可以帮你的吗",
    Error: "出错了，稍后重试吧",
    Prompt: {
      History: (content: string) => "这是历史聊天总结作为前情提要：" + content,
      Topic:
        '使用四到五个字直接返回这句话的简要主题，不要解释、不要标点、不要语气词、不要多余文本，不要加粗，如果没有主题，请直接返回"闲聊"',
      Summarize:
        "简要总结一下对话内容，用作后续的上下文提示 prompt，控制在 200 字以内",
    },
  },
  Copy: {
    Success: "已写入剪贴板",
    Failed: "复制失败，请赋予剪贴板权限",
  },
  Download: {
    Success: "内容已下载到您的目录。",
    Failed: "下载失败。",
  },
  Context: {
    Toast: (x: any) => `包含 ${x} 条预设提示词`,
    SettingsWithPrompts: (x: number) => `对话设置，包含 ${x} 条预设提示词`,
    Edit: "当前对话设置",
    Add: "新增一条对话",
    Clear: "上下文已清除",
    Revert: "恢复上下文",
  },
  Discovery: {
    Name: "发现",
  },
  Mcp: {
    Name: "MCP",
    Market: {
      Title: "MCP 市场",
      SubTitle: (count: number) => `${count} 个服务器已配置`,
      Loading: "加载预设服务器列表...",
      NoServers: "没有可用的服务器",
      SearchPlaceholder: "搜索 MCP 服务器",
      ActionGroup: (name: string) => `${name} 操作`,
      Status: {
        Active: "运行中",
        Paused: "已停止",
        Error: "错误",
        Initializing: "初始化中",
        Undefined: "未配置",
      },
      Actions: {
        Add: "添加",
        Configure: "配置",
        Start: "启动",
        Stop: "停止",
        Tools: "查看",
        RestartAll: "重启所有",
      },
      Operations: {
        Starting: "正在启动...",
        Stopping: "正在停止...",
        Updating: "正在更新配置...",
        Creating: "正在创建 MCP 客户端...",
      },
      ConfigModal: {
        Title: "配置服务器 - ",
        Save: "保存",
        Cancel: "取消",
        InputPlaceholder: "输入 {0}",
        AddItem: "添加 {0}",
      },
      ToolsModal: {
        Title: "服务器详情 - ",
        Close: "关闭",
        NoTools: "没有可用的工具",
        Loading: "加载中...",
        LoadFailedHint: "请稍后重试，或检查该 MCP 服务器状态。",
      },
      Errors: {
        LoadFailed: "加载预设服务器失败",
        InitFailed: "加载初始状态失败",
        SaveFailed: "保存配置失败",
        StartFailed: "启动服务器失败，请检查日志",
        StopFailed: "停止服务器失败",
        ToolsLoadFailed: "加载工具失败",
        ConfigUpdateSuccess: "服务器配置更新成功",
        StopSuccess: "服务器已成功停止",
        RestartSuccess: "重启所有服务器成功",
        RestartFailed: "重启服务器失败",
      },
    },
  },
  FineTuned: {
    Sysmessage: "你是一个助手",
  },
  SearchChat: {
    Name: "搜索",
    Page: {
      Title: "搜索聊天记录",
      Search: "输入搜索关键词",
      Recent: "最近聊天",
      NoResult: "没有找到结果",
      NoData: "没有数据",
      Loading: "加载中",

      SubTitle: (count: number) => `搜索到 ${count} 条结果`,
    },
    Item: {
      View: "查看",
    },
  },
  Plugin: {
    Name: "插件",
    EnableWeb: "开启联网",
    Page: {
      Title: "插件",
      SubTitle: (count: number) => `${count} 个插件`,
      Search: "搜索插件",
      Create: "新建",
      Find: "您可以在Github上找到优秀的插件：",
      NoResult: "没有找到插件",
    },
    Item: {
      Info: (count: number) => `${count} 方法`,
      View: "查看",
      Edit: "编辑",
      Delete: "删除",
      DeleteConfirm: "确认删除？",
    },
    Auth: {
      None: "不需要授权",
      Basic: "Basic",
      Bearer: "Bearer",
      Custom: "自定义",
      CustomHeader: "自定义参数名称",
      Token: "Token",
      Proxy: "使用代理",
      ProxyDescription: "使用代理解决 CORS 错误",
      Location: "位置",
      LocationHeader: "Header",
      LocationQuery: "Query",
      LocationBody: "Body",
    },
    EditModal: {
      Title: (readonly: boolean) => `编辑插件 ${readonly ? "（只读）" : ""}`,
      Download: "下载",
      Auth: "授权方式",
      Content: "OpenAPI Schema",
      Load: "从网页加载",
      Method: "方法",
      NoTools: "暂无可用方法",
      Error: "格式错误",
    },
  },
  Mask: {
    Name: "面具",
    Page: {
      Title: "预设角色面具",
      SubTitle: (count: number) => `${count} 个预设角色定义`,
      Search: "搜索角色面具",
      Create: "新建",
      NoResult: "没有找到面具",
    },
    Item: {
      Info: (count: number) => `包含 ${count} 条预设对话`,
      Chat: "对话",
      View: "查看",
      Edit: "编辑",
      Delete: "删除",
      DeleteConfirm: "确认删除？",
    },
    EditModal: {
      Title: (readonly: boolean) =>
        `编辑预设面具 ${readonly ? "（只读）" : ""}`,
      Download: "下载预设",
      Clone: "克隆预设",
    },
    Config: {
      Avatar: "角色头像",
      Name: "角色名称",
      Sync: {
        Title: "使用全局设置",
        SubTitle: "当前对话是否使用全局模型设置",
        Confirm: "当前对话的自定义设置将会被自动覆盖，确认启用全局设置？",
      },
      HideContext: {
        Title: "隐藏预设对话",
        SubTitle: "隐藏后预设对话不会出现在聊天界面",
      },
      Artifacts: {
        Title: "启用Artifacts",
        SubTitle: "启用之后可以直接渲染HTML页面",
      },
      CodeFold: {
        Title: "启用代码折叠",
        SubTitle: "启用之后可以自动折叠/展开过长的代码块",
      },
      Share: {
        Title: "分享此面具",
        SubTitle: "生成此面具的直达链接",
        Action: "复制链接",
      },
    },
  },
  NewChat: {
    Return: "返回",
    Skip: "直接开始",
    NotShow: "不再展示",
    ConfirmNoShow: "确认禁用？禁用后可以随时在设置中重新启用。",
    Title: "挑选一个面具",
    SubTitle: "现在开始，与面具背后的灵魂思维碰撞",
    More: "查看全部",
    CodeBlockExpand: "展开完整代码块",
    Mermaid: {
      Preview: "预览 Mermaid 图表",
      Caption: "Mermaid 图表",
      Unavailable: "图表暂不可用",
      SourceLabel: "Mermaid 源码",
    },
    Think: "已深度思考",
    Thinking: "正在思考中...",
    ThinkingTime: (seconds: number) => ` (用时 ${seconds} 秒)`,
  },

  URLCommand: {
    Code: "检测到链接中已经包含访问码，是否自动填入？",
    Settings: "检测到链接中包含了预制设置，是否自动填入？",
  },

  UI: {
    Confirm: "确认",
    Cancel: "取消",
    Close: "关闭",
    Clear: "清除",
    Create: "新建",
    Edit: "编辑",
    Export: "导出",
    Import: "导入",
    Sync: "同步",
    Config: "配置",
    Search: "搜索",
    All: "全部",
    CloseSidebar: "关闭侧边栏",
    ExpandSidebar: "展开栏",
    CollapseSidebar: "折叠栏",
    SearchModels: "搜索模型",
  },
  Exporter: {
    Description: {
      Title: "只有清除上下文之后的消息会被展示",
    },
    Model: "模型",
    Messages: "消息",
    Topic: "主题",
    Time: "时间",
  },
  SdPanel: {
    Prompt: "画面提示",
    NegativePrompt: "否定提示",
    PleaseInput: (name: string) => `请输入${name}`,
    AspectRatio: "横纵比",
    ImageStyle: "图像风格",
    OutFormat: "输出格式",
    AIModel: "AI模型",
    ModelVersion: "模型版本",
    Submit: "提交生成",
    ParamIsRequired: (name: string) => `${name}不能为空`,
    Styles: {
      D3Model: "3D模型",
      AnalogFilm: "模拟电影",
      Anime: "动漫",
      Cinematic: "电影风格",
      ComicBook: "漫画书",
      DigitalArt: "数字艺术",
      Enhance: "增强",
      FantasyArt: "幻想艺术",
      Isometric: "等角",
      LineArt: "线描",
      LowPoly: "低多边形",
      ModelingCompound: "建模材料",
      NeonPunk: "霓虹朋克",
      Origami: "折纸",
      Photographic: "摄影",
      PixelArt: "像素艺术",
      TileTexture: "贴图",
    },
  },
  Sd: {
    SubTitle: (count: number) => `共 ${count} 条绘画`,
    Actions: {
      Params: "查看参数",
      Copy: "复制提示词",
      Delete: "删除",
      Retry: "重试",
      ReturnHome: "返回首页",
      History: "查看历史",
    },
    EmptyRecord: "暂无绘画记录",
    Status: {
      Name: "状态",
      Success: "成功",
      Error: "失败",
      Wait: "等待中",
      Running: "运行中",
    },
    Danger: {
      Delete: "确认删除？",
    },
    GenerateParams: "生成参数",
    Detail: "详情",
  },
};

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type LocaleType = typeof cn;
export type PartialLocaleType = DeepPartial<typeof cn>;

export default cn;
