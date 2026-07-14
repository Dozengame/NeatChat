import DeleteIcon from "../icons/delete.svg";
import styles from "./home.module.scss";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DraggableProvided,
  type DraggableRubric,
  type OnDragEndResponder,
} from "@hello-pangea/dnd";
import { FixedSizeList, type ListChildComponentProps } from "react-window";
import {
  createContext,
  forwardRef,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { shallow } from "zustand/shallow";

import { useChatStore } from "../store/chat";
import Locale from "../locales";
import { Path } from "../constant";
import { MaskAvatar } from "./mask";
import { showConfirm } from "./ui-lib-actions";
import { useCompactScreen } from "../utils";
import clsx from "clsx";

const CHAT_LIST_VIRTUAL_THRESHOLD = 100;
const CHAT_LIST_ROW_HEIGHT = 58;
const CHAT_LIST_COMPACT_ROW_HEIGHT = 70;
const CHAT_LIST_OVERSCAN = 4;
const CHAT_LIST_FALLBACK_HEIGHT = 480;

type ChatListItem = {
  id: string;
  title: string;
  lastUpdate: number;
  count: number;
  avatar: string;
  model: string;
};

type ChatItemProps = {
  title: string;
  count: number;
  lastUpdate: number;
  selected: boolean;
  id: string;
  index: number;
  narrow?: boolean;
  avatar: string;
  model: string;
  totalCount?: number;
  onSelect: (index: number) => void;
  onDelete: (index: number) => void | Promise<void>;
  virtualStyle?: CSSProperties;
};

function ChatItemBody(props: ChatItemProps & { provided: DraggableProvided }) {
  const draggableRef = useRef<HTMLDivElement | null>(null);
  const { pathname: currentPath } = useLocation();
  const isCurrentChatItem =
    props.selected && (currentPath === Path.Chat || currentPath === Path.Home);

  useEffect(() => {
    if (props.selected && !props.virtualStyle && draggableRef.current) {
      draggableRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [props.selected, props.virtualStyle]);

  return (
    <div
      className={clsx(styles["chat-item"], {
        [styles["chat-item-selected"]]: isCurrentChatItem,
        [styles["chat-item-virtual"]]: props.virtualStyle,
      })}
      ref={(element) => {
        draggableRef.current = element;
        props.provided.innerRef(element);
      }}
      {...props.provided.draggableProps}
      style={{
        ...props.virtualStyle,
        ...props.provided.draggableProps.style,
      }}
      role="listitem"
      aria-setsize={props.totalCount}
      aria-posinset={props.totalCount ? props.index + 1 : undefined}
      aria-current={isCurrentChatItem ? "page" : undefined}
      title={`${props.title}\n${Locale.ChatItem.ChatItemCount(props.count)}`}
    >
      <Link
        to={Path.Chat}
        className={styles["chat-item-link"]}
        onClick={() => props.onSelect(props.index)}
        {...(props.provided.dragHandleProps ?? {})}
        aria-label={`${props.title}, ${Locale.ChatItem.ChatItemCount(
          props.count,
        )}`}
      >
        {props.narrow ? (
          <div className={styles["chat-item-narrow"]}>
            <div className={clsx(styles["chat-item-avatar"], "no-dark")}>
              <MaskAvatar avatar={props.avatar} model={props.model} />
            </div>
            <div className={styles["chat-item-narrow-count"]}>
              {props.count}
            </div>
          </div>
        ) : (
          <>
            <div className={styles["chat-item-title"]}>{props.title}</div>
            <div className={styles["chat-item-info"]}>
              <div className={styles["chat-item-count"]}>
                {Locale.ChatItem.ChatItemCount(props.count)}
              </div>
              <div className={styles["chat-item-date"]}>
                {new Date(props.lastUpdate).toLocaleString()}
              </div>
            </div>
          </>
        )}
      </Link>

      <button
        type="button"
        className={styles["chat-item-delete"]}
        onClick={(event) => {
          void props.onDelete(props.index);
          event.preventDefault();
          event.stopPropagation();
        }}
        aria-label={Locale.Home.DeleteChat}
      >
        <DeleteIcon />
      </button>
    </div>
  );
}

function ChatItemComponent(props: ChatItemProps) {
  return (
    <Draggable draggableId={props.id} index={props.index}>
      {(provided) => <ChatItemBody {...props} provided={provided} />}
    </Draggable>
  );
}

export const ChatItem = memo(ChatItemComponent);

type VirtualChatListData = {
  items: ChatListItem[];
  selectedIndex: number;
  narrow?: boolean;
  onSelect: ChatItemProps["onSelect"];
  onDelete: ChatItemProps["onDelete"];
};

function VirtualChatRow({ data, index, style }: ListChildComponentProps) {
  const rowData = data as VirtualChatListData;
  const item = rowData.items[index];
  if (!item) return null;

  return (
    <ChatItem
      {...item}
      index={index}
      selected={index === rowData.selectedIndex}
      narrow={rowData.narrow}
      onSelect={rowData.onSelect}
      onDelete={rowData.onDelete}
      totalCount={rowData.items.length}
      virtualStyle={style}
    />
  );
}

const VirtualOuterPropsContext = createContext<Record<string, unknown>>({});
const VirtualOuterElement = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function VirtualOuterElement(props, ref) {
  const outerProps = useContext(VirtualOuterPropsContext);
  return <div ref={ref} {...props} {...outerProps} />;
});

function useVirtualListHeight(enabled: boolean) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(CHAT_LIST_FALLBACK_HEIGHT);

  useEffect(() => {
    if (!enabled) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    const syncHeight = () => {
      const nextHeight = Math.floor(viewport.getBoundingClientRect().height);
      if (nextHeight > 0) setHeight(nextHeight);
    };
    syncHeight();
    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(syncHeight);
    observer?.observe(viewport);
    window.addEventListener("resize", syncHeight);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", syncHeight);
    };
  }, [enabled]);

  return { height, viewportRef };
}

export function ChatList(props: { narrow?: boolean }) {
  const chatListSource = useChatStore(
    (state) => [state.sessionListRevision, state.sessions] as const,
    shallow,
  );
  const items = useMemo<ChatListItem[]>(() => {
    const sessions = chatListSource[1];
    return sessions.map((session) => ({
      id: session.id,
      title: session.topic,
      lastUpdate: session.lastUpdate,
      count: session.messages.length,
      avatar: session.mask.avatar,
      model: session.mask.modelConfig.model,
    }));
  }, [chatListSource]);
  const selectedIndex = useChatStore((state) => state.currentSessionIndex);
  const selectSession = useChatStore((state) => state.selectSession);
  const moveSession = useChatStore((state) => state.moveSession);
  const deleteSession = useChatStore((state) => state.deleteSession);
  const navigate = useNavigate();
  const isCompactScreen = useCompactScreen();
  const shouldVirtualize = items.length > CHAT_LIST_VIRTUAL_THRESHOLD;
  const { height, viewportRef } = useVirtualListHeight(shouldVirtualize);
  const virtualListRef = useRef<FixedSizeList>(null);

  useEffect(() => {
    if (
      shouldVirtualize &&
      selectedIndex >= 0 &&
      selectedIndex < items.length
    ) {
      virtualListRef.current?.scrollToItem(selectedIndex, "smart");
    }
  }, [items.length, selectedIndex, shouldVirtualize]);

  const onSelect = useCallback(
    (index: number) => {
      navigate(Path.Chat);
      selectSession(index);
    },
    [navigate, selectSession],
  );
  const onDelete = useCallback(
    async (index: number) => {
      if (
        (!props.narrow && !isCompactScreen) ||
        (await showConfirm(Locale.Home.DeleteChat))
      ) {
        deleteSession(index);
      }
    },
    [deleteSession, isCompactScreen, props.narrow],
  );
  const onDragEnd: OnDragEndResponder = useCallback(
    (result) => {
      const { destination, source } = result;
      if (!destination) return;
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return;
      }
      moveSession(source.index, destination.index);
    },
    [moveSession],
  );
  const virtualData = useMemo<VirtualChatListData>(
    () => ({
      items,
      selectedIndex,
      narrow: props.narrow,
      onSelect,
      onDelete,
    }),
    [items, onDelete, onSelect, props.narrow, selectedIndex],
  );
  const renderClone = useCallback(
    (
      provided: DraggableProvided,
      _snapshot: unknown,
      rubric: DraggableRubric,
    ) => {
      const item = items[rubric.source.index];
      return item ? (
        <ChatItemBody
          {...item}
          index={rubric.source.index}
          selected={rubric.source.index === selectedIndex}
          narrow={props.narrow}
          onSelect={onSelect}
          onDelete={onDelete}
          provided={provided}
        />
      ) : null;
    },
    [items, onDelete, onSelect, props.narrow, selectedIndex],
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable
        droppableId="chat-list"
        mode={shouldVirtualize ? "virtual" : "standard"}
        renderClone={shouldVirtualize ? renderClone : undefined}
      >
        {(provided, snapshot) =>
          shouldVirtualize ? (
            <div ref={viewportRef} className={styles["chat-list-viewport"]}>
              <VirtualOuterPropsContext.Provider
                value={{
                  ...provided.droppableProps,
                  role: "list",
                  "aria-label": Locale.SearchChat.Page.Recent,
                }}
              >
                <FixedSizeList
                  className={styles["chat-list-virtual-scroll"]}
                  height={height}
                  itemCount={
                    snapshot.isUsingPlaceholder
                      ? items.length + 1
                      : items.length
                  }
                  itemData={virtualData}
                  itemKey={(index, data) =>
                    (data as VirtualChatListData).items[index]?.id ??
                    `placeholder-${index}`
                  }
                  itemSize={
                    isCompactScreen
                      ? CHAT_LIST_COMPACT_ROW_HEIGHT
                      : CHAT_LIST_ROW_HEIGHT
                  }
                  outerElementType={VirtualOuterElement}
                  outerRef={provided.innerRef}
                  overscanCount={CHAT_LIST_OVERSCAN}
                  ref={virtualListRef}
                  width="100%"
                >
                  {VirtualChatRow}
                </FixedSizeList>
              </VirtualOuterPropsContext.Provider>
            </div>
          ) : (
            <div
              className={styles["chat-list"]}
              ref={provided.innerRef}
              {...provided.droppableProps}
              role="list"
              aria-label={Locale.SearchChat.Page.Recent}
            >
              {items.map((item, index) => (
                <ChatItem
                  {...item}
                  key={item.id}
                  index={index}
                  selected={index === selectedIndex}
                  narrow={props.narrow}
                  onSelect={onSelect}
                  onDelete={onDelete}
                />
              ))}
              {provided.placeholder}
            </div>
          )
        }
      </Droppable>
    </DragDropContext>
  );
}
