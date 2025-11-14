type PostPreviewProps = {
  platformId: string;
  content: string;
};

import { platforms } from "../data/platforms";
import { sliceByGraphemes, splitGraphemes } from "../lib/postUtils";

export function PostPreview({ platformId, content }: PostPreviewProps) {
  const platform = platforms.find((p) => p.id === platformId);
  const limit = platform?.charLimit;
  const previewContent =
    typeof limit === "number" && limit > 0
      ? sliceByGraphemes(content, limit)
      : content;
  const isTruncated =
    typeof limit === "number" &&
    limit > 0 &&
    splitGraphemes(content).length > limit;
  const author = { name: "Elon Musk", handle: "@elonmusk" };

  const cardBase =
    "rounded-lg overflow-hidden border border-gray-800/60 shadow-sm";

  const renderX = () => (
    <div
      className={`${cardBase} bg-gradient-to-b from-[#0b0b0b] to-[#121212] text-white p-3 min-w-0`}
    >
      <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t" />
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-sm font-semibold">
          {author.name[0]}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">{author.name}</div>
              <div className="text-xs text-gray-400">{author.handle}</div>
            </div>
            <div className="text-xs text-gray-400">{platform?.name || ""}</div>
          </div>
          <div className="mt-3 text-sm break-words whitespace-pre-wrap">
            {previewContent}
            {isTruncated ? " …" : ""}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
            <div>· 2h</div>
            <div>· 123</div>
            <div>· 45</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLinkedIn = () => (
    <div className={`${cardBase} bg-[#0f1720] text-white p-4 min-w-0`}>
      <div className="h-1 w-full bg-gradient-to-r from-blue-700 to-cyan-500 rounded-t" />
      <div className="flex items-center gap-3 mb-3">
        <div className="w-14 h-14 bg-gray-800 rounded-md" />
        <div>
          <div className="text-sm font-semibold">{author.name}</div>
          <div className="text-xs text-gray-400">CEO • SpaceX • Tesla</div>
        </div>
      </div>
      <div className="text-sm break-words whitespace-pre-wrap">
        {previewContent}
        {isTruncated ? " …" : ""}
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
        <div>· 1d</div>
        <div>· 34 comments</div>
      </div>
    </div>
  );

  const renderInstagram = () => (
    <div className={`${cardBase} bg-[#0b0b0b] text-white p-4 min-w-0`}>
      <div className="h-1 w-full bg-gradient-to-r from-pink-500 to-yellow-400 rounded-t" />

      {/* header: avatar + author */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
            <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center text-sm font-semibold">
              {author.name[0]}
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <div className="text-sm font-semibold leading-5 truncate">
                {author.name}
              </div>
              <div className="text-xs text-gray-400 truncate">
                {author.handle}
              </div>
            </div>
            <button className="text-xs text-pink-400 font-semibold px-3 py-1 rounded-md border border-pink-700/30">
              Follow
            </button>
          </div>
        </div>
      </div>

      {/* image area */}
      <div className="w-full rounded-lg overflow-hidden mb-3 bg-gradient-to-tr from-gray-700 to-gray-500 h-56 flex items-center justify-center">
        <div className="text-3xl text-white/60">📷</div>
      </div>

      {/* caption */}
      <div className="text-sm text-gray-200 break-words whitespace-pre-wrap">
        {previewContent}
        {isTruncated ? <span className="text-gray-400">… </span> : null}
      </div>
      {isTruncated ? (
        <div className="mt-2">
          <button className="text-xs text-gray-300/90 font-medium">
            View more
          </button>
        </div>
      ) : null}

      {/* actions */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-3">
          <button className="text-xl">❤</button>
          <button className="text-xl">💬</button>
          <button className="text-xl">✈️</button>
        </div>
        <div className="text-xs text-gray-400">· 3h</div>
      </div>
    </div>
  );

  if (platformId === "twitter" || platformId === "x") return renderX();
  if (platformId === "linkedin") return renderLinkedIn();
  if (platformId === "instagram") return renderInstagram();
  // fallback
  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg border border-gray-800/50 min-w-0">
      <div className="break-words whitespace-pre-wrap">{previewContent}</div>
    </div>
  );
}

export default PostPreview;
