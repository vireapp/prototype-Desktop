import fs from 'fs';
import path from 'path';

const webFile = path.resolve('d:/CODES/prototype/src/components/room/room-client-v2.tsx');
const desktopFile = path.resolve('d:/CODES/prototype Desktop/src/renderer/src/components/room/room-client-v2.tsx');

let code = fs.readFileSync(webFile, 'utf8');

// 1. Next.js to React Router mapping
code = code.replace(
  'import Link from "next/link";',
  'import { Link, useNavigate } from "react-router-dom";\nimport { ScreenSharePicker } from "@/components/room/screen-share-picker";'
);

code = code.replace(
  'import { useRouter } from "next/navigation";',
  `const useRouter = (): {
  push: (path: string) => void
  replace: (path: string) => void
  refresh: () => void
  back: () => void
} => {
  const navigate = useNavigate()
  return {
    push: (path: string) => navigate(path),
    replace: (path: string) => navigate(path, { replace: true }),
    refresh: () => window.location.reload(),
    back: () => navigate(-1)
  }
}`
);

// Fix actions import
code = code.replace(
  'import { joinRoom, getRoomRole, RoomRole } from "@/app/dashboard/rooms/actions";',
  'import { joinRoom, getRoomRole, RoomRole } from "@/components/rooms/actions";'
);

// 2. React Player dynamic import
code = code.replace(
  'import dynamic from "next/dynamic";',
  ''
);

const dynamicImportStr = `const ReactPlayer = dynamic(() => import("react-player"), {
  ssr: false,
}) as any;`;
code = code.replace(dynamicImportStr, "import ReactPlayer from 'react-player';");

// 3. Insert State for Screen Share Picker
const stateAnchor = 'const [isPeopleOverlayOpen, setIsPeopleOverlayOpen] = useState(false);';
code = code.replace(
  stateAnchor,
  `${stateAnchor}\n  const [isScreenSharePickerOpen, setIsScreenSharePickerOpen] = useState(false);`
);

// 4. Intercept Screen Share selection
code = code.replace(
  'handleLocalScreenShare();',
  'setIsScreenSharePickerOpen(true);'
);

// 5. Append ScreenSharePicker modal before end
const returnEnd = '</ChannelSecretContext.Provider>';
const pickerMarkup = `
      {/* Screen Share Source Picker */}
      <ScreenSharePicker
        open={isScreenSharePickerOpen}
        onClose={() => setIsScreenSharePickerOpen(false)}
        onSelect={async (sourceId) => {
          await handleLocalScreenShare(sourceId)
          setActivity('screen_share')
        }}
      />
`;
code = code.replace(returnEnd, pickerMarkup + '\n    ' + returnEnd);

// 6. Desktop specific absolute top positioning
// Let's find: pt-20
code = code.replace('pt-20 px-6", isDockVisible ? "pb-28" : "pb-4"', 'pt-2 px-6", isDockVisible ? "pb-28" : "pb-4"');
// Add top-8 to absolute inset-0 wrapper
code = code.replace(
  'className="absolute inset-0 z-50 flex overflow-hidden font-sans selection:bg-zinc-800 bg-zinc-950 text-zinc-50"',
  'className="absolute inset-0 top-8 z-50 flex overflow-hidden font-sans selection:bg-zinc-800 bg-zinc-950 text-zinc-50"'
);

// 7. Enable VirtualTV feature logic in mobile overlay buttons
code = code.replace(
  `{/* HIDDEN FOR NOW: 
                  !room.is_public && (`,
  `{!room.is_public && (`
);
code = code.replace(
  `                    </Button>
                  )*/}`,
  `                    </Button>
                  )}`
);

fs.writeFileSync(desktopFile, code);
console.log('Patched and saved successfully.');
