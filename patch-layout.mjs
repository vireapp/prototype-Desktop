import fs from 'fs';
import path from 'path';

const desktopFile = path.resolve('d:/CODES/prototype Desktop/src/renderer/src/components/room/room-client-v2.tsx');
const chatBarFile = path.resolve('d:/CODES/prototype Desktop/src/renderer/src/components/room/quick-chat-bar.tsx');

// 1. Fix QuickChatBar overlap classes and focus ring
let chatCode = fs.readFileSync(chatBarFile, 'utf8');
chatCode = chatCode.replace(
  'className="hidden md:flex fixed bottom-8 right-6 flex-col justify-end pointer-events-none z-40 max-w-[280px] lg:max-w-[320px] xl:max-w-[380px] w-full"',
  'className="hidden md:flex relative flex-col justify-end pointer-events-none z-40 w-[320px]"'
);
chatCode = chatCode.replace(
  'focus-visible:ring-0',
  'focus:outline-none focus-visible:ring-offset-0 focus-visible:outline-none border-none focus-visible:ring-0'
);
fs.writeFileSync(chatBarFile, chatCode);

// 2. Move QuickChatBar inside Dock in room-client-v2.tsx
let roomCode = fs.readFileSync(desktopFile, 'utf8');

const quickChatRenderStr = `        <QuickChatBar
          roomId={room.id}
          user={user}
          channelSecret={channelSecret}
          roomName={room.name}
          roomDescription={room.description || ""}
          currentActivity={activity}
        />`;

if (roomCode.includes(quickChatRenderStr)) {
  // Remove from old location
  roomCode = roomCode.replace(quickChatRenderStr, '');

  // Insert into new location right after Focus Mode button closing div
  const dockEndTarget = `                </Button>
              </div>`;

  roomCode = roomCode.replace(dockEndTarget, dockEndTarget + '\n              ' + quickChatRenderStr);
  
  fs.writeFileSync(desktopFile, roomCode);
  console.log('Successfully patched dock layout.');
} else {
  console.error('Could not find QuickChatBar string to replace');
}
