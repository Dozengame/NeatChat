const mockSessions = Array.from({ length: 1000 }, (_, index) => ({
  id: `session-${index}`,
  topic: `Session ${index}`,
  lastUpdate: index,
  messages: Array.from({ length: index % 4 }, (_, messageIndex) => ({
    id: `message-${index}-${messageIndex}`,
  })),
  mask: {
    avatar: "1f916",
    modelConfig: { model: "gpt-5.6-terra" },
  },
}));

const mockChatState = {
  sessions: mockSessions,
  sessionListRevision: 0,
  currentSessionIndex: 0,
  selectSession: jest.fn(),
  moveSession: jest.fn(),
  deleteSession: jest.fn(),
};

jest.mock("../app/store/chat", () => ({
  useChatStore: jest.fn(
    (selector?: (state: typeof mockChatState) => unknown) =>
      selector ? selector(mockChatState) : mockChatState,
  ),
}));

type DroppableMockProps = {
  children: (provided: any, snapshot: any) => React.ReactNode;
};

const mockDroppable = jest.fn(({ children }: DroppableMockProps) =>
  children(
    {
      innerRef: jest.fn(),
      droppableProps: { "data-testid": "droppable" },
      placeholder: null,
    },
    { isUsingPlaceholder: false },
  ),
);

jest.mock("@hello-pangea/dnd", () => ({
  DragDropContext: ({ children }: { children: React.ReactNode }) => children,
  Droppable: (props: DroppableMockProps) => mockDroppable(props),
  Draggable: ({ children }: { children: (provided: any) => React.ReactNode }) =>
    children({
      innerRef: jest.fn(),
      draggableProps: {},
      dragHandleProps: {},
    }),
}));

jest.mock("../app/components/mask", () => ({
  MaskAvatar: ({ avatar, model }: { avatar: string; model: string }) => (
    <span data-avatar={avatar} data-model={model} data-testid="mask-avatar" />
  ),
}));

jest.mock("../app/utils", () => ({
  useCompactScreen: jest.fn(() => false),
}));

jest.mock("../app/components/ui-lib-actions", () => ({
  showConfirm: jest.fn(async () => true),
}));

jest.mock("../app/icons/delete.svg", () => ({
  __esModule: true,
  default: () => <svg data-testid="delete-icon" />,
}));

import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ChatList } from "../app/components/chat-list";
import fs from "node:fs";
import path from "node:path";

describe("large chat list rendering", () => {
  beforeEach(() => {
    mockDroppable.mockClear();
    mockChatState.sessions = mockSessions;
    mockChatState.currentSessionIndex = 0;
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: jest.fn(),
    });
  });

  test("windows 1000 sessions and opts into the DnD virtual-list contract", () => {
    const { container } = render(
      <MemoryRouter>
        <ChatList />
      </MemoryRouter>,
    );

    expect(
      container.querySelectorAll('[role="listitem"]').length,
    ).toBeLessThanOrEqual(80);
    const visibleItems = Array.from(
      container.querySelectorAll('[role="listitem"]'),
    );
    expect(visibleItems.length).toBeGreaterThan(0);
    expect(visibleItems[0]).toHaveAttribute("aria-setsize", "1000");
    expect(visibleItems[0]).toHaveAttribute("aria-posinset", "1");
    expect(mockDroppable).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "virtual",
        renderClone: expect.any(Function),
      }),
    );
  });

  test("virtualizes before a medium-sized history becomes a scroll bottleneck", () => {
    mockChatState.sessions = mockSessions.slice(0, 120);

    const { container } = render(
      <MemoryRouter>
        <ChatList />
      </MemoryRouter>,
    );

    expect(container.querySelectorAll('[role="listitem"]').length).toBeLessThan(
      80,
    );
    expect(mockDroppable).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "virtual" }),
    );
  });

  test("keeps an externally selected session mounted in the virtual window", () => {
    mockChatState.currentSessionIndex = mockSessions.length - 1;

    const { getByText } = render(
      <MemoryRouter>
        <ChatList />
      </MemoryRouter>,
    );

    expect(
      getByText("Session 999").closest('[role="listitem"]'),
    ).toHaveAttribute("aria-current", "page");
  });

  test("keeps virtual rows inside the fixed-size layout contract", () => {
    const componentSource = fs.readFileSync(
      path.join(process.cwd(), "app/components/chat-list.tsx"),
      "utf8",
    );
    const stylesSource = fs.readFileSync(
      path.join(process.cwd(), "app/components/home.module.scss"),
      "utf8",
    );

    expect(componentSource).toMatch(/itemKey=\{\(index, data\).*?\.id/s);
    expect(componentSource).toContain('styles["chat-item-virtual"]');
    expect(stylesSource).toMatch(
      /\.chat-item\s*\{[\s\S]*?box-sizing:\s*border-box;/,
    );
    expect(stylesSource).toMatch(
      /\.chat-item-virtual\s*\{[\s\S]*?margin:\s*0\s*!important;/,
    );
  });

  test("keeps the sidebar off the full chat-store subscription path", () => {
    const listSource = fs.readFileSync(
      path.join(process.cwd(), "app/components/chat-list.tsx"),
      "utf8",
    );
    const sidebarSource = fs.readFileSync(
      path.join(process.cwd(), "app/components/sidebar.tsx"),
      "utf8",
    );

    expect(listSource).not.toContain("selectChatListItems");
    expect(listSource).toMatch(/sessionListRevision[\s\S]*?useMemo/);
    expect(sidebarSource).not.toMatch(/useChatStore\(\)/);
    expect(sidebarSource).toMatch(/useChatStore\.getState\(\)\.nextSession/);
    expect(sidebarSource).toMatch(
      /window\.addEventListener\("keydown", onKeyDown\);[\s\S]*?\}, \[\]\);/,
    );
  });

  test("refreshes memoized avatar metadata after an in-place mask update", () => {
    const session = {
      ...mockSessions[0],
      mask: {
        avatar: "1f916",
        modelConfig: { model: "gpt-5.6-terra" },
      },
    };
    mockChatState.sessions = [session];

    const view = render(
      <MemoryRouter>
        <ChatList narrow />
      </MemoryRouter>,
    );

    expect(view.getByTestId("mask-avatar")).toHaveAttribute(
      "data-avatar",
      "1f916",
    );
    expect(view.getByTestId("mask-avatar")).toHaveAttribute(
      "data-model",
      "gpt-5.6-terra",
    );

    session.mask.avatar = "1f680";
    session.mask.modelConfig.model = "gpt-5.6-sol";
    mockChatState.sessionListRevision += 1;
    view.rerender(
      <MemoryRouter>
        <ChatList narrow />
      </MemoryRouter>,
    );

    expect(view.getByTestId("mask-avatar")).toHaveAttribute(
      "data-avatar",
      "1f680",
    );
    expect(view.getByTestId("mask-avatar")).toHaveAttribute(
      "data-model",
      "gpt-5.6-sol",
    );
  });

  test("attaches and renews size observation when crossing the virtual threshold", () => {
    const originalResizeObserver = globalThis.ResizeObserver;
    const observe = jest.fn();
    const disconnect = jest.fn();
    const ResizeObserverMock = jest.fn(() => ({ observe, disconnect }));
    Object.defineProperty(globalThis, "ResizeObserver", {
      configurable: true,
      value: ResizeObserverMock,
    });
    mockChatState.sessions = mockSessions.slice(0, 100);

    const view = render(
      <MemoryRouter>
        <ChatList />
      </MemoryRouter>,
    );
    expect(ResizeObserverMock).not.toHaveBeenCalled();

    mockChatState.sessions = mockSessions.slice(0, 101);
    mockChatState.sessionListRevision += 1;
    view.rerender(
      <MemoryRouter>
        <ChatList />
      </MemoryRouter>,
    );
    expect(ResizeObserverMock).toHaveBeenCalledTimes(1);
    expect(observe).toHaveBeenCalledTimes(1);

    mockChatState.sessions = mockSessions.slice(0, 100);
    mockChatState.sessionListRevision += 1;
    view.rerender(
      <MemoryRouter>
        <ChatList />
      </MemoryRouter>,
    );
    expect(disconnect).toHaveBeenCalledTimes(1);

    mockChatState.sessions = mockSessions.slice(0, 101);
    mockChatState.sessionListRevision += 1;
    view.rerender(
      <MemoryRouter>
        <ChatList />
      </MemoryRouter>,
    );
    expect(ResizeObserverMock).toHaveBeenCalledTimes(2);

    Object.defineProperty(globalThis, "ResizeObserver", {
      configurable: true,
      value: originalResizeObserver,
    });
  });
});
