import { getClientConfig } from "../config/client";
import { SubmitKey } from "../store/config";
import type { LocaleType } from "./index";
// if you are adding a new translation, please use PartialLocaleType instead of LocaleType

const isApp = !!getClientConfig()?.isApp;
const en: LocaleType = {
  WIP: "Coming Soon...",
  Error: {
    Unauthorized: isApp
      ? "Invalid access code. Please enter it again."
      : "Invalid access code. Please enter it again.",
    AccessRestricted: "Access is temporarily limited. Please try again later.",
  },
  Auth: {
    Return: "Return",
    Title: "Need Access Code",
    Tips: "Please enter access code below",
    Input: "access code",
    Confirm: "Confirm",
    Validating: "Validating...",
    Invalid: "Invalid access code. Please enter it again.",
    RateLimited: "Too many attempts. Please try again later.",
    Later: "Later",
  },
  ChatItem: {
    ChatItemCount: (count: number) => `${count} messages`,
  },
  Chat: {
    SubTitle: (count: number) => `${count} messages`,
    EditMessage: {
      Title: "Edit All Messages",
      Topic: {
        Title: "Topic",
        SubTitle: "Change the current topic",
      },
    },
    Actions: {
      ChatList: "Go To Chat List",
      CompressedHistory: "Compressed History Memory Prompt",
      Export: "Export All Messages as Markdown",
      Copy: "Copy",
      Stop: "Stop",
      Retry: "Retry",
      RetryToolTraceBlocked:
        "A tool may already have run. Send a new message to continue without repeating the action.",
      Pin: "Pin",
      PinToastContent: "Pinned 1 messages to contextual prompts",
      PinToastAction: "View",
      Delete: "Delete",
      Edit: "Edit",
      FullScreen: "FullScreen",
      RefreshTitle: "Refresh Title",
      RefreshToast: "Title refresh request sent",
      Speech: "Play",
      StopSpeech: "Stop",
    },
    Commands: {
      new: "Start a new chat",
      newm: "Start a new chat with mask",
      next: "Next Chat",
      prev: "Previous Chat",
      clear: "Clear Context",
      fork: "Copy Chat",
      del: "Delete Chat",
    },
    InputActions: {
      Stop: "Stop",
      ToBottom: "To Latest",
      Theme: {
        auto: "Auto",
        light: "Light Theme",
        dark: "Dark Theme",
      },
      Prompt: "Prompts",
      Masks: "Masks",
      Clear: "Clear Context",
      Settings: "Settings",
      UploadImage: "Upload Images",
    },
    Rename: "Rename Chat",
    Typing: "Typing…",
    EmptyTitle: "Hello! What would you like to discuss?",
    EmptySuggestions: [
      "Summarize this content",
      "Plan my day",
      "Create a product poster",
      "Analyze this file",
    ] as string[],
    EmptySuggestionTitles: [
      "Summarize text",
      "Plan schedule",
      "Creative poster",
      "Analyze document",
    ] as string[],
    Input: (submitKey: string) => {
      var inputHints = `${submitKey} to send`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += ", Shift + Enter to wrap";
      }
      return inputHints;
    },
    MobileInput: "Type a message...",
    Send: "Send",
    StartSpeak: "Start Speak",
    StopSpeak: "Stop Speak",
    Config: {
      Reset: "Reset to Default",
      SaveAs: "Save as Mask",
    },
    IsContext: "Contextual Prompt",
    ShortcutKey: {
      Title: "Keyboard Shortcuts",
      newChat: "Open New Chat",
      focusInput: "Focus Input Field",
      copyLastMessage: "Copy Last Reply",
      copyLastCode: "Copy Last Code Block",
      showShortcutKey: "Show Shortcuts",
    },
    TokenInfo: {
      TokenCount: (count: number) => `${count} Tokens`,
      FirstDelay: (delay: number) => `First Response: ${delay}ms`,
      Label: (details?: string) =>
        details ? `Token info, ${details}` : "Token info",
    },
    SourcesHeading: "Sources",
    ChatToolMenu: {
      MultimodalTools: "Multimodal tools",
      AddContent: "Add",
      FilesAndImages: "Files & images",
      Capacity: "3 img · 5 files",
      Full: "Full",
      UploadAttachment: "Upload attachment",
      AttachmentFull: "Attachments full: up to 3 images and 5 files",
      ImageGeneration: "Image generation",
      DisableImageGeneration: "Turn off image generation",
      SessionTools: "Conversation tools",
      Session: "Conversation",
      ModelsAndSettings: "Models and settings",
      Close: "Close conversation tools",
      Open: "Open conversation tools",
      MenuLabel: "Conversation tools menu",
    },
    Attachments: {
      TextConverted: "Long text was converted to a file attachment",
      ContentTruncated: (limit: number) =>
        `File content was truncated to ${limit} characters`,
      AddedFiles: (count: number) =>
        `Added ${count} ${count === 1 ? "file" : "files"}`,
      MaxFiles: "You can upload up to 5 files; only the first 5 were kept",
      FileSlotsFull: "You can upload up to 5 files",
      AddedImages: (count: number) =>
        `Added ${count} ${count === 1 ? "image" : "images"}`,
      MaxImages: "You can upload up to 3 images; only the first 3 were kept",
      ImageSlotsFull: "You can upload up to 3 images",
      FileTooLarge: (name: string) =>
        `File ${name} exceeds the 15 MB limit and was ignored`,
      DragReadFailed: "Failed to read dropped attachments",
      PasteReadFailed: "Failed to read pasted attachments",
      FileReadFailed: "Failed to read file",
      LongTextConverted: "Long text was converted to an attachment",
      InputTextFile: (timestamp?: string) =>
        `Input text${timestamp ? `_${timestamp}` : ""}.txt`,
      LongTextFile: "Long text.txt",
      PastedTextFile: "Pasted text.txt",
      LongTextMessage:
        "I sent a long text file. Its content was converted to an attachment.",
      FileMetadata: {
        Name: "File name",
        Type: "Type",
        Size: "Size",
      },
      JoinMessages: (messages: string[]) => messages.join(", "),
      LiveStatus: (text: string, hint: string) => `${text}, ${hint}.`,
      Full: "Attachments full: up to 3 images and 5 files",
      DropTitle: "Drop files or images here to upload",
      DropDetect: "Detect dropped attachments",
      Preview: "Attachment preview",
      AddMore: "Add more attachments",
      FullShort: "Full",
      EditImage: (index: number) => `Edit image attachment ${index}`,
      DeleteImage: (index: number) => `Delete image attachment ${index}`,
      EditFile: (index: number, name: string) =>
        `Edit file attachment ${index}: ${name}`,
      EditFileContent: (name: string) => `Edit file content: ${name}`,
      DeleteFile: (index: number, name: string) =>
        `Delete file attachment ${index}: ${name}`,
      Reader: {
        UnknownError: "Unknown error",
        UnsupportedFileType: "Unsupported file type",
        UnsupportedFile: (name: string) =>
          `${name || "This file"} is not a supported file type`,
        PastedFileName: "Pasted file.txt",
        ReadFailed: (name: string, error: string) =>
          `Failed to read ${name}: ${error}`,
        NoFilesRead: "No files were read successfully",
        TextFileType: "Text file",
        ContentTruncated: (length: number) =>
          `[File truncated. Original length: ${length} characters]`,
        ImageLoadFailed: "Failed to load image",
        Legacy: {
          Title: (name: string) => `Legacy ${name} document detected`,
          Description: (extension: string) =>
            `This legacy ${extension} file cannot be parsed completely.`,
          ConvertIntro: "For best results, convert the file as follows:",
          OpenWith: (app: string) => `Open the file with ${app}`,
          SaveAs: "Choose File > Save As",
          ChooseFormat: (format: string) => `Select ${format}`,
          SaveAndUpload: "Save and upload the new file",
          PartialTextAttempt:
            "NeatChat will try to extract some text, but the result may be incomplete.",
          PartialTableAttempt:
            "NeatChat will try to extract the table content, but the result may be incomplete.",
          Warning: (extension: string, target: string) =>
            `[Notice] Text extracted from this legacy ${extension} file may be incomplete. Convert it to ${target} and upload it again for best results.`,
          CannotFullyRead: (extension: string, target: string) =>
            `[Unable to read] This legacy ${extension} file could not be parsed completely. Convert it to ${target} and upload it again, or paste its content directly.`,
          CannotRead: (extension: string, target: string) =>
            `[Unable to read] This legacy ${extension} file could not be parsed. Convert it to ${target} and upload it again, or paste its content directly.`,
          FormatErrorTitle: "Invalid file format",
          FormatErrorDescription:
            "The file could not be read because its format is invalid or it is damaged.",
          ConvertDoc: "If this is a .doc file, convert it as follows:",
          FormatErrorMessage:
            "The file format is invalid or damaged. Convert .doc files to .docx and upload them again.",
        },
        Word: {
          Name: "Word",
          App: "Microsoft Word or WPS Writer",
          Format: "Word document (.docx)",
        },
        PowerPoint: {
          Name: "PowerPoint",
          App: "PowerPoint or WPS Presentation",
          Format: "PowerPoint presentation (.pptx)",
          Slide: (number: number, text: string) =>
            `--- Slide ${number} ---\n${text}`,
          Content: (slides: string) =>
            `PowerPoint presentation content:\n\n${slides}`,
          ExtractionFailed:
            "[Extraction failed] No text could be extracted from the PowerPoint file. The format may be unsupported or the file may contain no text.",
          ParseFailed:
            "[Extraction failed] The PowerPoint file could not be parsed. Copy and paste the important content instead.",
        },
        Pdf: {
          Content: (pages: number) => `PDF content (${pages} pages):\n\n`,
          UnreadablePage: "[Unable to parse this page]",
          BlankPage: "[Blank or image-only content]",
          Page: (number: number, text: string) =>
            `--- Page ${number} ---\n${text}\n\n`,
          Truncated: (processed: number, total: number) =>
            `\n[Large file: processed the first ${processed} of ${total} pages.]\n`,
          LimitedTitle: "Limited PDF text extraction",
          LimitedDescription:
            "Text could not be extracted from the PDF. Possible reasons:",
          Scanned: "The PDF is scanned and contains images instead of text",
          Protected: "The PDF is protected or encrypted",
          Damaged: "The PDF uses an unusual format or is damaged",
          Suggestions: "Suggestions:",
          UseOcr: "Process the PDF with OCR software",
          CopyManually: "Copy and paste the required content manually",
          UseSmallerFile: "Try a smaller PDF file",
          LimitedContent: (name: string, sizeMb: string, pages: number) =>
            `[Limited PDF text extraction]\n\nNo text could be extracted from ${name}; it may be scanned or protected.\n\nFile information:\n- Size: ${sizeMb} MB\n- Pages: ${pages}\n\nUse OCR software or copy and paste the required content manually.`,
          ParseFailedTitle: "Failed to parse PDF",
          ParseFailedDescription: "The PDF content could not be parsed.",
          Error: (message: string) => `Error: ${message}`,
          ParseFailedHelp:
            "Open the file in another PDF viewer, then copy and paste its content.",
          ParseFailedContent:
            "[Failed to parse PDF] The PDF content could not be extracted. Open it in a PDF viewer, then copy and paste its content.",
        },
        Zip: {
          BinaryFile: (size: number) => `[Binary file, ${size} bytes]`,
          UnreadableFile: "[Unable to read this file]",
          Content: (name: string) => `ZIP content (${name}):\n`,
          TotalFiles: (count: number) => `Total files: ${count}`,
          ShowingFirst: (count: number) => ` (showing the first ${count})`,
          TextFiles: (count: number) => `\nText files: ${count}\n\n`,
          Truncated: (processed: number, total: number) =>
            `\n[Large ZIP: processed the first ${processed} of ${total} files.]\n`,
          LimitedTitle: "Limited ZIP text extraction",
          NoReadableText:
            "This ZIP contains no readable text files, or its file formats are unsupported.",
          SupportedTextOnly:
            "Only common text files such as .txt, .md, .js, and .py can be extracted.",
          ExtractHelp:
            "Extract the ZIP and upload the required text files separately.",
          ParseFailedTitle: "Failed to parse ZIP",
          ParseFailedDescription: "The ZIP content could not be parsed.",
          ParseFailedHelp:
            "Make sure this is a valid ZIP file, or extract it and upload files separately.",
          ParseFailedContent:
            "[Failed to parse ZIP] The ZIP content could not be extracted. Make sure it is a valid ZIP file, or extract it and upload files separately.",
        },
        Excel: {
          Name: "Excel",
          App: "Microsoft Excel or WPS Spreadsheets",
          Format: "Excel workbook (.xlsx)",
          Content: (name: string) => `Excel workbook content (${name}):\n\n`,
          SheetCount: (count: number) => `Worksheets: ${count}\n\n`,
          Sheet: (name: string) => `=== Worksheet: ${name} ===\n\n`,
          EmptySheet: "[Empty worksheet]\n\n",
          ParseFailedTitle: "Failed to parse Excel file",
          ParseFailedDescription: "The Excel content could not be parsed.",
          ParseFailedHelp:
            "Open the file in Excel, then copy and paste its content.",
          ParseFailedContent:
            "[Failed to parse Excel file] The Excel content could not be extracted. Open it in Excel, then copy and paste its content.",
        },
      },
      Drag: {
        AddHint: "Release to add · up to 3 images and 5 files",
        BlockedHint: "Release will not add new attachments",
        ImageLimit: "The 3-image limit has been reached",
        FileLimit: "The 5-file limit has been reached",
        Limit: "Attachment limit reached",
        Detect: "Release to detect attachments",
        ImageCount: (count: number) =>
          `${count} ${count === 1 ? "image" : "images"}`,
        FileCount: (count: number) =>
          `${count} ${count === 1 ? "file" : "files"}`,
        WillAdd: (parts: string[], overflow: boolean) =>
          overflow
            ? `Will add ${parts.join(" and ")}; the rest will be ignored`
            : `Will add ${parts.join(" and ")}`,
      },
    },
    ImageGeneration: {
      NotEnabled: "Image generation is not enabled",
      EnableFailed: "Failed to enable image generation",
      DisableFailed: "Failed to disable image generation",
      Enabled: "Image generation enabled",
      Disabled: "Image generation disabled",
      Failed: "Image generation failed",
      ModeEnabled: "Image generation mode is enabled",
      ModeLabel: "Image generation",
      Task: "Image generation task",
      Submitting: "Submitting to jimeng-mcp",
      QueryTimeout: "Result query timed out. Please try again later",
      SubmitOrQueryFailed:
        "Task submission or result query failed. Please try again later",
      Progress: {
        Model: (model: string) => (model ? `\n\nModel: ${model}` : ""),
        Preparing: "Preparing the image generation request...",
        Generating: "Generating the image. Please wait...",
        Saving: "Image generated. Saving the image...",
      },
      Display: {
        Task: "Image generation task",
        ToolCall: "Tool call",
        GenerationType: "Generation type: ",
        OptimizedPrompt: "Optimized Prompt:",
        Parameters: "Parameters:",
        Progress: "Progress:",
        Status: "Status: ",
        Submitting: "Submitting to jimeng-mcp",
        PreparingTool: "Preparing to run the tool",
        PreparingSubmission: "Preparing to submit to jimeng-mcp",
        TextToImage: "Text to image",
        ImageToImage: "Image to image",
        TextToVideo: "Text to video",
        ImageToVideo: "Image to video",
        AspectRatio: "Aspect ratio: ",
        Resolution: "Resolution: ",
        ModelVersion: "Model version: ",
        Duration: "Duration: ",
        Submitted: "Submitted; waiting for status",
        Success: "Generation succeeded",
        Generating: "Generating",
        Failure: "Generation failed",
        Cancelled: "Cancelled",
        Timeout: "Query timed out",
        Unknown: "Unknown",
      },
    },
    ModelMenu: {
      SelectModel: (model: string, detail: string) =>
        `Select model: ${model}, ${detail}`,
      SelectModelAndParams: "Select model and parameters",
      Close: "Close model selector",
      ModelAndReasoning: "Model and reasoning effort",
      AvailableModels: "Available models",
      Empty: "No models available",
      ReasoningEffort: "Reasoning effort",
      ReasoningOptions: "Reasoning effort options",
      ImageSize: "Image size",
      ImageSizeOptions: "Image size options",
      GeneratedImageSize: "Generated image size",
      ImageQuality: "Image quality",
      ImageQualityOptions: "Image quality options",
      CurrentInputMode: "Current input mode",
      SelectedReasoning: (label: string) => `Reasoning effort: ${label}`,
    },
    Accessibility: {
      PromptSuggestions: "Prompt suggestions",
      ChatMessages: "Chat messages",
      SuggestedQuestions: "Suggested questions",
      MessageList: "Conversation message list",
      UserMessage: (index: number) => `User message ${index}`,
      AssistantMessage: (index: number) => `Assistant message ${index}`,
      MessageActions: (label: string) => `${label} actions`,
      CombinedLabels: (labels: string[]) => labels.join(", "),
      ActionLabel: (group: string, action: string) => `${group}: ${action}`,
    },
  },
  Export: {
    Title: "Export Messages",
    Copy: "Copy All",
    Download: "Download",
    MessageFromYou: "Message From You",
    MessageFromChatGPT: "Message From ChatGPT",
    Share: "Share to ShareGPT",
    Format: {
      Title: "Export Format",
      SubTitle: "Markdown or PNG Image",
    },
    IncludeContext: {
      Title: "Including Context",
      SubTitle: "Export context prompts in mask or not",
    },
    Steps: {
      Select: "Select",
      Preview: "Preview",
    },
    Image: {
      Toast: "Capturing Image...",
      Modal: "Long press or right click to save image",
    },
    Artifacts: {
      Title: "Share Artifacts",
      Error: "Share Error",
      GitHubTitle: "Open GitHub repository",
      ReloadTitle: "Reload preview",
    },
  },
  Select: {
    Search: "Search",
    All: "Select All",
    Latest: "Select Latest",
    Clear: "Clear",
  },
  Memory: {
    Title: "Memory Prompt",
    EmptyContent: "Nothing yet.",
    Send: "Send Memory",
    Copy: "Copy Memory",
    Reset: "Reset Session",
    ResetConfirm:
      "Resetting will clear the current conversation history and historical memory. Are you sure you want to reset?",
  },
  Home: {
    NewChat: "New Chat",
    PrimarySection: "Start",
    ContentSection: "Content",
    LocalContent: {
      Title: "Local content",
      SubTitle: "Search chats, files, and generated work",
    },
    DeleteChat: "Confirm to delete the selected conversation?",
    DeleteToast: "Chat Deleted",
    Revert: "Revert",
  },
  Settings: {
    Title: "Settings",
    SubTitle: "All Settings",
    ShowPassword: "ShowPassword",
    Sections: {
      General: {
        Title: "General preferences",
        Description: "Input, theme, language, and font.",
      },
      Chat: {
        Title: "Chat experience",
        Description:
          "Manage titles, preview bubbles, Artifacts, code reading, and conversation tools.",
      },
      Data: {
        Title: "Data",
        Description: "Cloud sync, local import/export, masks, and prompts.",
      },
      Model: {
        Title: "Model",
        Description:
          "Access code, providers, model parameters, and compression.",
      },
      Advanced: {
        Title: "Advanced preferences",
        Description: "Reset and clear actions.",
      },
    },
    Danger: {
      Reset: {
        Title: "Reset All Settings",
        SubTitle: "Reset all setting items to default",
        Action: "Reset",
        Confirm: "Confirm to reset all settings to default?",
      },
      Clear: {
        Title: "Clear All Data",
        SubTitle: "Clear all messages and settings",
        Action: "Clear",
        Confirm: "Confirm to clear all messages and settings?",
      },
    },
    Lang: {
      Name: "Language", // ATTENTION: if you wanna add a new translation, please do not translate this value, leave it as `Language`
      All: "All Languages",
    },
    FontSize: {
      Title: "Font Size",
      SubTitle: "Adjust font size of chat content",
    },
    FontFamily: {
      Title: "Chat Font Family",
      SubTitle:
        "Font Family of the chat content, leave empty to apply global default font",
      Placeholder: "Font Family Name",
    },
    InjectSystemPrompts: {
      Title: "Inject System Prompts",
      SubTitle: "Inject a global system prompt for every request",
    },
    InputTemplate: {
      Title: "Input Template",
      SubTitle: "Newest message will be filled to this template",
    },
    CustomInstructions: {
      Enable: {
        Title: "Enable Custom Instructions",
        SubTitle:
          "When enabled, future new chats will include these instructions",
      },
      Content: {
        Title: "Custom Instructions",
        SubTitle: (count: number) => `${count}/1500`,
        Edit: "Full-screen edit",
        Done: "Done",
        Placeholder:
          "Describe what the assistant should always follow in new chats, such as response style, context, or output format.",
      },
    },

    Update: {
      Version: (x: string) => `Version: ${x}`,
      IsLatest: "Latest version",
      CheckUpdate: "Check Update",
      IsChecking: "Checking update...",
      FoundUpdate: (x: string) => `Found new version: ${x}`,
      GoToUpdate: "Update",
      Success: "Update Successful.",
      Failed: "Update Failed.",
    },
    SendKey: "Send Key",
    Theme: "Theme",
    TightBorder: "Tight Border",
    SendPreviewBubble: {
      Title: "Send Preview Bubble",
      SubTitle: "Preview markdown in bubble",
    },
    AutoGenerateTitle: {
      Title: "Auto Generate Title",
      SubTitle: "Generate a suitable title based on the conversation content",
    },
    Sync: {
      CloudState: "Last Update",
      NotSyncYet: "Not sync yet",
      Success: "Sync Success",
      Fail: "Sync Fail",

      Config: {
        Modal: {
          Title: "Config Sync",
          Check: "Check Connection",
        },
        SyncType: {
          Title: "Sync Type",
          SubTitle: "Choose your favorite sync service",
        },
        Proxy: {
          Title: "Enable CORS Proxy",
          SubTitle: "Enable a proxy to avoid cross-origin restrictions",
        },
        ProxyUrl: {
          Title: "Proxy Endpoint",
          SubTitle:
            "Only applicable to the built-in CORS proxy for this project",
        },

        WebDav: {
          Endpoint: "WebDAV Endpoint",
          UserName: "User Name",
          Password: "Password",
        },

        UpStash: {
          Endpoint: "UpStash Redis REST Url",
          UserName: "Backup Name",
          Password: "UpStash Redis REST Token",
        },
      },

      LocalState: "Local Data",
      Overview: (overview: any) => {
        return `${overview.chat} chats, ${overview.message} messages, ${overview.prompt} prompts, ${overview.mask} masks`;
      },
      ImportFailed: "Failed to import from file",
    },
    Mask: {
      Splash: {
        Title: "Mask Splash Screen",
        SubTitle: "Show a mask splash screen before starting new chat",
      },
      Builtin: {
        Title: "Hide Builtin Masks",
        SubTitle: "Hide builtin masks in mask list",
      },
    },
    Prompt: {
      Disable: {
        Title: "Disable auto-completion",
        SubTitle: "Input / to trigger auto-completion",
      },
      List: "Prompt List",
      ListCount: (builtin: number, custom: number) =>
        `${builtin} built-in, ${custom} user-defined`,
      Edit: "Edit",
      Modal: {
        Title: "Prompt List",
        Add: "Add One",
        Search: "Search Prompts",
      },
      EditModal: {
        Title: "Edit Prompt",
      },
    },
    HistoryCount: {
      Title: "Attached Messages Count",
      SubTitle: "Number of sent messages attached per request",
    },
    CompressThreshold: {
      Title: "History Compression Threshold",
      SubTitle:
        "Will compress if uncompressed messages length exceeds the value",
    },

    Usage: {
      Title: "Account Balance",
      SubTitle(used: any, total: any) {
        return `Used this month $${used}, subscription $${total}`;
      },
      IsChecking: "Checking...",
      Check: "Check",
      NoAccess: "Enter access code to check balance",
    },
    Access: {
      AccessCode: {
        Title: "Access Code",
        SubTitle: "Access control Enabled",
        Placeholder: "Enter Code",
      },
      CustomEndpoint: {
        Title: "Custom Endpoint",
        SubTitle: "Use custom Azure or OpenAI service",
      },
      Provider: {
        Title: "Model Provider",
        SubTitle: "Select Azure or OpenAI",
      },
      OpenAI: {
        ApiKey: {
          Title: "OpenAI API Key",
          SubTitle: "User custom OpenAI Api Key",
          Placeholder: "sk-xxx",
        },

        Endpoint: {
          Title: "OpenAI Endpoint",
          SubTitle: "Must start with http(s):// or use /api/openai as default",
        },
      },
      Azure: {
        ApiKey: {
          Title: "Azure Api Key",
          SubTitle: "Check your api key from Azure console",
          Placeholder: "Azure Api Key",
        },

        Endpoint: {
          Title: "Azure Endpoint",
          SubTitle: "Example: ",
        },

        ApiVerion: {
          Title: "Azure Api Version",
          SubTitle: "Check your api version from azure console",
        },
      },
      Anthropic: {
        ApiKey: {
          Title: "Anthropic API Key",
          SubTitle: "Use a custom Anthropic API key",
          Placeholder: "Anthropic API Key",
        },

        Endpoint: {
          Title: "Endpoint Address",
          SubTitle: "Example: ",
        },

        ApiVerion: {
          Title: "API Version (claude api version)",
          SubTitle: "Select and input a specific API version",
        },
      },
      Baidu: {
        ApiKey: {
          Title: "Baidu API Key",
          SubTitle: "Use a custom Baidu API Key",
          Placeholder: "Baidu API Key",
        },
        SecretKey: {
          Title: "Baidu Secret Key",
          SubTitle: "Use a custom Baidu Secret Key",
          Placeholder: "Baidu Secret Key",
        },
        Endpoint: {
          Title: "Endpoint Address",
          SubTitle: "not supported, configure in .env",
        },
      },
      Tencent: {
        ApiKey: {
          Title: "Tencent API Key",
          SubTitle: "Use a custom Tencent API Key",
          Placeholder: "Tencent API Key",
        },
        SecretKey: {
          Title: "Tencent Secret Key",
          SubTitle: "Use a custom Tencent Secret Key",
          Placeholder: "Tencent Secret Key",
        },
        Endpoint: {
          Title: "Endpoint Address",
          SubTitle: "not supported, configure in .env",
        },
      },
      ByteDance: {
        ApiKey: {
          Title: "ByteDance API Key",
          SubTitle: "Use a custom ByteDance API Key",
          Placeholder: "ByteDance API Key",
        },
        Endpoint: {
          Title: "Endpoint Address",
          SubTitle: "Example: ",
        },
      },
      Alibaba: {
        ApiKey: {
          Title: "Alibaba API Key",
          SubTitle: "Use a custom Alibaba Cloud API Key",
          Placeholder: "Alibaba Cloud API Key",
        },
        Endpoint: {
          Title: "Endpoint Address",
          SubTitle: "Example: ",
        },
      },
      Moonshot: {
        ApiKey: {
          Title: "Moonshot API Key",
          SubTitle: "Use a custom Moonshot API Key",
          Placeholder: "Moonshot API Key",
        },
        Endpoint: {
          Title: "Endpoint Address",
          SubTitle: "Example: ",
        },
      },
      XAI: {
        ApiKey: {
          Title: "XAI API Key",
          SubTitle: "Use a custom XAI API Key",
          Placeholder: "XAI API Key",
        },
        Endpoint: {
          Title: "Endpoint Address",
          SubTitle: "Example: ",
        },
      },
      ChatGLM: {
        ApiKey: {
          Title: "ChatGLM API Key",
          SubTitle: "Use a custom ChatGLM API Key",
          Placeholder: "ChatGLM API Key",
        },
        Endpoint: {
          Title: "Endpoint Address",
          SubTitle: "Example: ",
        },
      },
      Stability: {
        ApiKey: {
          Title: "Stability API Key",
          SubTitle: "Use a custom Stability API Key",
          Placeholder: "Stability API Key",
        },
        Endpoint: {
          Title: "Endpoint Address",
          SubTitle: "Example: ",
        },
      },
      Iflytek: {
        ApiKey: {
          Title: "Iflytek API Key",
          SubTitle: "Use a Iflytek API Key",
          Placeholder: "Iflytek API Key",
        },
        ApiSecret: {
          Title: "Iflytek API Secret",
          SubTitle: "Use a Iflytek API Secret",
          Placeholder: "Iflytek API Secret",
        },
        Endpoint: {
          Title: "Endpoint Address",
          SubTitle: "Example: ",
        },
      },
      CustomModel: {
        Title: "Custom Models",
        SubTitle: "Custom model options, seperated by comma",
        ModelSelector: "Select Models",
        FetchModels: "Load Models",
        FetchSuccessFromClient: (count: number) =>
          `Successfully fetched ${count} models from client configuration`,
        FetchSuccessFromServer: (count: number) =>
          `Successfully fetched ${count} models from server configuration`,
        FetchFailedFromClient: (error: string) =>
          `Failed to fetch models from client configuration: ${error}`,
        FetchFailedFromServer: (error: string) =>
          `Failed to fetch models from server configuration: ${error}`,
        ApiKeyRequired: "Please set API key first",
        InvalidResponse: "Invalid response format",
        RequestFailed: (status: number) => `Request failed: ${status}`,
        InputPlaceholder: "Enter custom model name and press Enter to add",
        SelectAll: "Select All",
        SelectNone: "Select None",
        ModelExists: "Model already exists",
        EditCategories: "Edit Model Categories",
        CategoryName: "Category Name",
        MatchKeyword: "Match Keyword",
        AddCategory: "Add",
        CategoryTip:
          'Match keyword will be used to identify model categories, e.g. "gpt" will match all models containing "gpt"',
        ExistingCategories: "Existing Custom Categories",
        NoCustomCategories: "No custom categories yet",
        InputPlaceholderEnter: "Enter custom model name and press Enter to add",
        RefreshModels: "Refresh Models",
        ModelNameLabel: "Model Name",
        MatchRule: "Match Rule",
        RestoreDefaults: "Restore Defaults",
        DeleteConfirm: "Confirm to delete this model?",
        AuthRequired: "Please enter access password in settings first",
        SaveEditFailed: "Failed to update local storage",
        DeleteModelSuccess: "Model deleted from local storage",
        DeleteModelFailed: "Failed to update local storage",
        ModelNotFound: "Model not found for deletion",
        ModelNotFoundInList: "Model not found in complete model list",
        EditModelNotFound: "Model not found for editing",
        EditModelNotFoundInList:
          "Model not found in complete model list for editing",
        FetchFailed: "Failed to fetch model list",
        RestoreRulesSuccess: "Default matching rules restored",
        RestoreRulesFailed: "Failed to restore default matching rules",
        MatchPrefix: "Match",
        ModelCategory: "Model Category",
        ModelCategoryOther: "Other",
        TestModel: "Test Models",
        Testing: "Testing...",
        TestStart: "Starting to test {0} models...",
        TestSuccess: "{0}: Test successful ({1}ms)",
        TestFailed: "{0}: Test failed",
        TestComplete: "Test complete: {0}/{1} models available",
        TestError: "Test error: {0}",
        SelectModelsToTest: "Please select models to test first",
        Unavailable: "Unavailable",
        NoModelsToTest: "No models to test currently",
        TestButton: "Test",
        TestTimeout: "Timeout",
        TestUnavailable: "Failed",
        TestButtonTooltip: "Click to test this model",
        RetestButtonTooltip: "Click to retest this model",
        TestStartMessage: "Starting to test model: {0}...",
        TestSuccessMessage: "{0}: Test successful ({1}s)",
        TestTimeoutMessage: "{0}: Timeout",
        TestErrorMessage: "{0}: {1}",
        TestErrorPrefix: "Test error: ",
        ServerTestFailedError: "Server test failed: {0}",
        UpdateStorageFailedError: "Failed to update local storage",
        DefaultTestFailedMessage: "Test failed",
        TestAllModelsStart: "Starting to test {0} models...",
        StopTest: "Stop Testing",
        TestAll: "Test All",
        TestStopped: "Testing stopped",
        TestCompleteMessage: "Test complete: {0}/{1} models available",
        TimeoutOptions: {
          FiveSeconds: "5s",
          SixSeconds: "6s",
          SevenSeconds: "7s",
          EightSeconds: "8s",
          NineSeconds: "9s",
          TenSeconds: "10s",
        },
      },
      Google: {
        ApiKey: {
          Title: "API Key",
          SubTitle: "Obtain your API Key from Google AI",
          Placeholder: "Google AI API Key",
        },

        Endpoint: {
          Title: "Endpoint Address",
          SubTitle: "Example: ",
        },

        ApiVersion: {
          Title: "API Version (specific to gemini-pro)",
          SubTitle: "Select a specific API version",
        },
        GoogleSafetySettings: {
          Title: "Google Safety Settings",
          SubTitle: "Select a safety filtering level",
        },
      },
    },

    Model: "Model",
    ImageGeneration: {
      Size: "Image Size",
      Quality: "Image Quality",
      Auto: "Auto",
      Low: "Low",
      Medium: "Medium",
      High: "High",
      Standard: "Standard",
      HD: "HD",
    },
    TextVerbosity: {
      Title: "Response Detail (text.verbosity)",
      SubTitle: "Controls response detail in the Responses API",
      Low: "Concise",
      Medium: "Balanced",
      High: "Detailed",
    },
    CompressModel: {
      Title: "Summary Model",
      SubTitle: "Model used to compress history and generate title",
    },
    Temperature: {
      Title: "Temperature",
      SubTitle: "A larger value makes the more random output",
    },
    TopP: {
      Title: "Top P",
      SubTitle: "Do not alter this value together with temperature",
    },
    ReasoningEffort: {
      Title: "Reasoning Effort",
      SubTitle: "Used by GPT-5.x and newer models",
      None: "Fast",
      Low: "Standard",
      Medium: "Advanced",
      High: "Deep",
      XHigh: "Extra Deep",
      Max: "Maximum",
      NoneDescription: "Uses no extra reasoning and prioritizes speed",
      LowDescription: "Best for most questions",
      MediumDescription: "Handles complex tasks more carefully",
      HighDescription: "For difficult reasoning tasks",
      XHighDescription: "For tasks needing more exploration and verification",
      MaxDescription: "For the hardest quality-first tasks",
    },
    GPT56Capabilities: {
      ConfigSource: {
        Prefix: "Source: ",
        Separator: ". ",
        Locked: "This setting is locked by the administrator",
        AdminForced: "Administrator locked",
        ServerDefault: "Administrator default",
        UserOverride: "Personal setting",
        ConversationOverride: "Current conversation",
        Fallback: "System default",
      },
      ReasoningMode: {
        Title: "Reasoning Mode",
        SubTitle: "Standard balances speed and quality; Pro prioritizes depth",
        Standard: "Standard",
        Pro: "Pro",
      },
      ReasoningContext: {
        Title: "Reasoning Context",
        SubTitle: "Controls current-turn or cross-turn reasoning context",
        Auto: "Auto",
        CurrentTurn: "Current turn",
        AllTurns: "All turns",
      },
      InputImageDetail: {
        Title: "Input Image Detail",
        SubTitle:
          "Defaults to High so GPT-5.6 Auto does not increase cost and latency with Original",
        Low: "Low",
        High: "High",
        Original: "Original",
        Auto: "Auto",
      },
      PromptCacheMode: {
        Title: "Prompt Cache Mode",
        SubTitle:
          "Disabled uses Explicit with no breakpoint to avoid cache writes; Implicit caches automatically; Explicit marks the latest input breakpoint",
        Disabled: "Disabled",
        Implicit: "Implicit",
        Explicit: "Explicit",
      },
      PromptCacheKey: {
        Title: "Prompt Cache Key",
        SubTitle:
          "Optional routing key sent to OpenAI; do not enter secrets or personal data",
      },
    },
    MaxTokens: {
      Title: "Max Output Tokens",
      SubTitle: "Maximum output tokens per response, including reasoning",
    },
    PresencePenalty: {
      Title: "Presence Penalty",
      SubTitle:
        "A larger value increases the likelihood to talk about new topics",
    },
    FrequencyPenalty: {
      Title: "Frequency Penalty",
      SubTitle:
        "A larger value decreasing the likelihood to repeat the same line",
    },
    TTS: {
      Enable: {
        Title: "Enable TTS",
        SubTitle: "Enable text-to-speech service",
      },
      Autoplay: {
        Title: "Enable Autoplay",
        SubTitle:
          "Automatically generate speech and play, you need to enable the text-to-speech switch first",
      },
      Model: "Model",
      Voice: {
        Title: "Voice",
        SubTitle: "The voice to use when generating the audio",
      },
      Speed: {
        Title: "Speed",
        SubTitle: "The speed of the generated audio",
      },
      Engine: "TTS Engine",
    },
    Realtime: {
      Enable: {
        Title: "Realtime Chat",
        SubTitle: "Enable realtime chat feature",
      },
      Start: "Start voice",
      Pause: "Pause voice",
      Connecting: "Connecting",
      Ready: "Voice ready",
      Listening: "Listening",
      Provider: {
        Title: "Model Provider",
        SubTitle: "Switch between different providers",
      },
      Model: {
        Title: "Model",
        SubTitle: "Select a model",
      },
      ApiKey: {
        Title: "API Key",
        SubTitle: "API Key",
        Placeholder: "API Key",
      },
      Azure: {
        Endpoint: {
          Title: "Endpoint",
          SubTitle: "Endpoint",
        },
        Deployment: {
          Title: "Deployment Name",
          SubTitle: "Deployment Name",
        },
      },
      Temperature: {
        Title: "Randomness (temperature)",
        SubTitle: "Higher values result in more random responses",
      },
    },
    EnableModelSearch: "Enable Model Search",
    EnableModelSearchSubTitle:
      "Enable to search and filter when selecting models",
    EnableThemeChange: {
      Title: "Enable Theme Switch",
      SubTitle: "Show theme switch button in chat",
    },
    EnablePromptHints: {
      Title: "Enable Prompt Hints Feature",
      SubTitle:
        "When enabled, you can trigger prompts with /, when disabled, the prompt feature will be completely turned off",
    },
    EnableClearContext: {
      Title: "Enable Clear Context",
      SubTitle: "Show clear context button in chat",
    },
    EnablePlugins: {
      Title: "Enable Plugins",
      SubTitle: "Show plugins button in chat",
    },
    EnableShortcuts: {
      Title: "Enable Shortcuts",
      SubTitle: "Show shortcuts button in chat",
    },
  },
  ImageActions: {
    Image: "Image",
    Preview: "Preview image",
    Download: "Download original image",
    PreviewWithLabel: (label: string) => `Preview ${label}`,
    DownloadWithLabel: (label: string) => `Download original ${label}`,
    PreviewAlt: "Image preview",
    PreviewDialog: "Image preview",
    PreviewDialogWithLabel: (label: string) => `Image preview: ${label}`,
    Message: (index: number, total: number) =>
      total > 1 ? `Image ${index} of ${total}` : "Image",
    OpenedOriginal: "Could not save the image directly; opened the original",
    ClosePreview: "Close preview",
  },
  ImageEditor: {
    Title: "Edit image",
    Undo: "Undo",
    Redo: "Redo",
    Toolbar: "Image editing tools",
    DrawingTools: "Drawing tools",
    Brush: "Brush tool",
    Eraser: "Eraser",
    Line: "Line tool",
    Arrow: "Arrow tool",
    Rectangle: "Rectangle tool",
    Circle: "Circle tool",
    Color: "Color",
    BrushSize: "Brush size",
    ChooseColor: (color: string) => `Choose color ${color}`,
    ChooseBrushSize: (size: number) => `Choose brush size ${size}`,
  },
  Markdown: {
    CopyCode: (language: string, copied: boolean) =>
      copied
        ? `Copied${language ? ` ${language}` : ""} code`
        : `Copy${language ? ` ${language}` : ""} code`,
    WrapCode: (language: string, enabled: boolean) =>
      `${enabled ? "Disable" : "Enable"} wrapping for${
        language ? ` ${language}` : ""
      } code`,
    ScrollableTable: (headers: string) =>
      headers
        ? `Markdown table (${headers}), horizontally scrollable`
        : "Markdown table, horizontally scrollable",
    ScrollableTableHint: "Swipe horizontally to see more columns",
    ScrollableFormula: "Display formula, horizontally scrollable",
    HtmlPreview: "HTML preview",
    Audio: "Audio",
    Video: "Video",
    MediaAttachment: (type: string, label: string) =>
      `${type} attachment: ${label}`,
    MediaFallback: (type: string) =>
      `${type} cannot be previewed right now. Open the original file instead.`,
    OpenOriginal: "Open original file",
    UnknownType: "Unknown type",
    FileCopied: "File content copied to clipboard",
    FileCopyFailed: "Failed to copy file content",
    FileNotFound: "File content could not be found",
    FileLoadFailed: "Failed to load file attachment",
  },
  FileAttachment: {
    Label: (name: string, type: string, size: string, interactive: boolean) =>
      `File attachment: ${name}, ${type}, ${size}.${
        interactive ? " Press to copy file content." : ""
      }`,
    Meta: (type: string, size: string) => `Type ${type}, size ${size}`,
  },
  UpdateAnnouncement: {
    Title: (date: string) => `${date} Update`,
    SectionTitle: "Update",
    Acknowledge: "Got it",
  },
  Store: {
    DefaultTopic: "New Conversation",
    BotHello: "Hello! How can I assist you today?",
    Error: "Something went wrong, please try again later.",
    Prompt: {
      History: (content: string) =>
        "This is a summary of the chat history as a recap: " + content,
      Topic:
        "Please generate a four to five word title summarizing our conversation without any lead-in, punctuation, quotation marks, periods, symbols, bold text, or additional text. Remove enclosing quotation marks.",
      Summarize:
        "Summarize the discussion briefly in 200 words or less to use as a prompt for future context.",
    },
  },
  Copy: {
    Success: "Copied to clipboard",
    Failed: "Copy failed, please grant permission to access clipboard",
  },
  Download: {
    Success: "Content downloaded to your directory.",
    Failed: "Download failed.",
  },
  Context: {
    Toast: (x: any) => `With ${x} contextual prompts`,
    SettingsWithPrompts: (x: number) =>
      `Chat settings, ${x} contextual prompts`,
    Edit: "Current Chat Settings",
    Add: "Add a Prompt",
    Clear: "Context Cleared",
    Revert: "Revert",
  },
  Discovery: {
    Name: "Discovery",
  },
  Mcp: {
    Name: "MCP",
    Market: {
      Title: "MCP Market",
      SubTitle: (count: number) => `${count} servers configured`,
      Loading: "Loading preset server list...",
      NoServers: "No servers available",
      SearchPlaceholder: "Search MCP Server",
      ActionGroup: (name: string) => `${name} actions`,
      Status: {
        Active: "Running",
        Paused: "Stopped",
        Error: "Error",
        Initializing: "Initializing",
        Undefined: "Not configured",
      },
      Actions: {
        Add: "Add",
        Configure: "Configure",
        Start: "Start",
        Stop: "Stop",
        Tools: "Tools",
        RestartAll: "Restart All",
      },
      Operations: {
        Starting: "Starting server...",
        Stopping: "Stopping server...",
        Updating: "Updating configuration...",
        Creating: "Creating MCP client...",
      },
      ConfigModal: {
        Title: "Configure Server - ",
        Save: "Save",
        Cancel: "Cancel",
        InputPlaceholder: "Enter {0}",
        AddItem: "Add {0}",
      },
      ToolsModal: {
        Title: "Server Details - ",
        Close: "Close",
        NoTools: "No tools available",
        Loading: "Loading...",
        LoadFailedHint: "Try again later, or check this MCP server status.",
      },
      Errors: {
        LoadFailed: "Failed to load preset servers",
        InitFailed: "Failed to load initial state",
        SaveFailed: "Failed to save configuration",
        StartFailed: "Failed to start server, please check logs",
        StopFailed: "Failed to stop server",
        ToolsLoadFailed: "Failed to load tools",
        ConfigUpdateSuccess: "Server configuration updated successfully",
        StopSuccess: "Server stopped successfully",
        RestartSuccess: "Restarting all clients",
        RestartFailed: "Failed to restart clients",
      },
    },
  },
  FineTuned: {
    Sysmessage: "You are an assistant that",
  },
  SearchChat: {
    Name: "Search",
    Page: {
      Title: "Search Chat History",
      Search: "Enter search query to search chat history",
      Recent: "Recent chats",
      NoResult: "No results found",
      NoData: "No data",
      Loading: "Loading...",

      SubTitle: (count: number) => `Found ${count} results`,
    },
    Item: {
      View: "View",
    },
  },
  Plugin: {
    Name: "Plugins",
    EnableWeb: "Enable Web Access",
    Page: {
      Title: "Plugins",
      SubTitle: (count: number) => `${count} plugins`,
      Search: "Search Plugin",
      Create: "Create",
      Find: "You can find awesome plugins on github: ",
      NoResult: "No plugins found",
    },
    Item: {
      Info: (count: number) => `${count} method`,
      View: "View",
      Edit: "Edit",
      Delete: "Delete",
      DeleteConfirm: "Confirm to delete?",
    },
    Auth: {
      None: "None",
      Basic: "Basic",
      Bearer: "Bearer",
      Custom: "Custom",
      CustomHeader: "Parameter Name",
      Token: "Token",
      Proxy: "Using Proxy",
      ProxyDescription: "Using proxies to solve CORS error",
      Location: "Location",
      LocationHeader: "Header",
      LocationQuery: "Query",
      LocationBody: "Body",
    },
    EditModal: {
      Title: (readonly: boolean) =>
        `Edit Plugin ${readonly ? "(readonly)" : ""}`,
      Download: "Download",
      Auth: "Authentication Type",
      Content: "OpenAPI Schema",
      Load: "Load From URL",
      Method: "Method",
      NoTools: "No methods available",
      Error: "OpenAPI Schema Error",
    },
  },
  Mask: {
    Name: "Mask",
    Page: {
      Title: "Prompt Template",
      SubTitle: (count: number) => `${count} prompt templates`,
      Search: "Search Templates",
      Create: "Create",
      NoResult: "No templates found",
    },
    Item: {
      Info: (count: number) => `${count} prompts`,
      Chat: "Chat",
      View: "View",
      Edit: "Edit",
      Delete: "Delete",
      DeleteConfirm: "Confirm to delete?",
    },
    EditModal: {
      Title: (readonly: boolean) =>
        `Edit Prompt Template ${readonly ? "(readonly)" : ""}`,
      Download: "Download",
      Clone: "Clone",
    },
    Config: {
      Avatar: "Bot Avatar",
      Name: "Bot Name",
      Sync: {
        Title: "Use Global Config",
        SubTitle: "Use global config in this chat",
        Confirm: "Confirm to override custom config with global config?",
      },
      HideContext: {
        Title: "Hide Context Prompts",
        SubTitle: "Do not show in-context prompts in chat",
      },
      Artifacts: {
        Title: "Enable Artifacts",
        SubTitle: "Can render HTML page when enable artifacts.",
      },
      CodeFold: {
        Title: "Enable CodeFold",
        SubTitle:
          "Automatically collapse/expand overly long code blocks when CodeFold is enabled",
      },
      Share: {
        Title: "Share This Mask",
        SubTitle: "Generate a link to this mask",
        Action: "Copy Link",
      },
    },
  },
  NewChat: {
    Return: "Return",
    Skip: "Just Start",
    Title: "Pick a Mask",
    SubTitle: "Chat with the Soul behind the Mask",
    More: "Find More",
    CodeBlockExpand: "Show full code block",
    Mermaid: {
      Preview: "Preview Mermaid diagram",
      Caption: "Mermaid diagram",
      Unavailable: "Diagram preview unavailable",
      SourceLabel: "Mermaid source",
    },
    NotShow: "Never Show Again",
    ConfirmNoShow: "Confirm to disable? You can enable it in settings later.",
    Thinking: "Thinking...",
    Think: "Deep Thought",
    ThinkingTime: (seconds: number) => ` (took ${seconds} seconds)`,
  },

  UI: {
    Confirm: "Confirm",
    Cancel: "Cancel",
    Close: "Close",
    Clear: "Clear",
    Create: "Create",
    Edit: "Edit",
    Export: "Export",
    Import: "Import",
    Sync: "Sync",
    Config: "Config",
    Search: "Search",
    All: "All",
    CloseSidebar: "Close sidebar",
    ExpandSidebar: "Expand sidebar",
    CollapseSidebar: "Collapse sidebar",
    SearchModels: "Search models",
  },
  Exporter: {
    Description: {
      Title: "Only messages after clearing the context will be displayed",
    },
    Model: "Model",
    Messages: "Messages",
    Topic: "Topic",
    Time: "Time",
  },
  URLCommand: {
    Code: "Detected access code from url, confirm to apply? ",
    Settings: "Detected settings from url, confirm to apply?",
  },
  SdPanel: {
    Prompt: "Prompt",
    NegativePrompt: "Negative Prompt",
    PleaseInput: (name: string) => `Please input ${name}`,
    AspectRatio: "Aspect Ratio",
    ImageStyle: "Image Style",
    OutFormat: "Output Format",
    AIModel: "AI Model",
    ModelVersion: "Model Version",
    Submit: "Submit",
    ParamIsRequired: (name: string) => `${name} is required`,
    Styles: {
      D3Model: "3d-model",
      AnalogFilm: "analog-film",
      Anime: "anime",
      Cinematic: "cinematic",
      ComicBook: "comic-book",
      DigitalArt: "digital-art",
      Enhance: "enhance",
      FantasyArt: "fantasy-art",
      Isometric: "isometric",
      LineArt: "line-art",
      LowPoly: "low-poly",
      ModelingCompound: "modeling-compound",
      NeonPunk: "neon-punk",
      Origami: "origami",
      Photographic: "photographic",
      PixelArt: "pixel-art",
      TileTexture: "tile-texture",
    },
  },
  Sd: {
    SubTitle: (count: number) => `${count} images`,
    Actions: {
      Params: "See Params",
      Copy: "Copy Prompt",
      Delete: "Delete",
      Retry: "Retry",
      ReturnHome: "Return Home",
      History: "History",
    },
    EmptyRecord: "No images yet",
    Status: {
      Name: "Status",
      Success: "Success",
      Error: "Error",
      Wait: "Waiting",
      Running: "Running",
    },
    Danger: {
      Delete: "Confirm to delete?",
    },
    GenerateParams: "Generate Params",
    Detail: "Detail",
  },
} as const;

export default en;
