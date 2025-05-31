import React, { useState } from 'react';
import { AvatarOption } from '../types/poker';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

interface AvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (nickname: string, avatar: string) => void;
  currentNickname: string;
  currentAvatar: string;
}

const AvatarModal: React.FC<AvatarModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentNickname,
  currentAvatar
}) => {
  const [nickname, setNickname] = useState(currentNickname);
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);

  const avatarOptions: AvatarOption[] = [
    { id: 'neo', icon: '🥷', name: 'Neo' },
    { id: 'morpheus', icon: '🧙‍♂️', name: 'Morpheus' },
    { id: 'trinity', icon: '🦹‍♀️', name: 'Trinity' },
    { id: 'agent', icon: '🤖', name: 'Agent Smith' },
    { id: 'oracle', icon: '🔮', name: 'Oracle' },
    { id: 'cipher', icon: '🥸', name: 'Cipher' },
    { id: 'redpill', icon: '💊', name: 'Red Pill' },
    { id: 'bluepill', icon: '🔵', name: 'Blue Pill' },
    { id: 'hacker', icon: '👨‍💻', name: 'Hacker' },
    { id: 'glitch', icon: '⚡', name: 'Glitch' },
    { id: 'digital', icon: '🌐', name: 'Digital Ghost' },
    { id: 'matrix', icon: '🔢', name: 'Matrix Walker' }
  ];

  const handleSave = () => {
    if (nickname.trim() && selectedAvatar) {
      onSave(nickname.trim(), selectedAvatar);
      onClose();
    }
  };

  const handleCancel = () => {
    setNickname(currentNickname);
    setSelectedAvatar(currentAvatar);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black border-2 border-[#00FF41] max-w-md text-[#00FF41]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold matrix-text text-center">
            CHOOSE YOUR AVATAR
          </DialogTitle>
          <DialogDescription className="text-center text-[#00FF41] opacity-80">
            Select your Matrix character identity for the poker table
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Nickname Input */}
          <div>
            <label className="block text-sm mb-2 text-[#00FF41]">NICKNAME:</label>
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your Matrix handle..."
              maxLength={12}
              className="w-full p-3 bg-black border border-[#00FF41] text-[#00FF41] focus:border-[#00AA2E] focus:outline-none"
            />
          </div>

          {/* Avatar Selection */}
          <div>
            <label className="block text-sm mb-2 text-[#00FF41]">AVATAR:</label>
            <div className="grid grid-cols-4 gap-3">
              {avatarOptions.map((avatar) => (
                <div
                  key={avatar.id}
                  className={`w-12 h-12 border bg-[#003300] rounded cursor-pointer flex items-center justify-center hover:border-[#00AA2E] transition-all ${
                    selectedAvatar === avatar.id 
                      ? 'border-[#00AA2E] matrix-glow' 
                      : 'border-[#00FF41]'
                  }`}
                  onClick={() => setSelectedAvatar(avatar.id)}
                  title={avatar.name}
                >
                  <span className="text-lg">{avatar.icon}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button
              onClick={handleSave}
              disabled={!nickname.trim() || !selectedAvatar}
              className="flex-1 px-4 py-3 border-2 border-[#00AA2E] bg-[#003300] hover:bg-[#00FF41] hover:text-black text-[#00FF41] transition-all duration-300"
            >
              <i className="fas fa-save mr-2"></i>SAVE IDENTITY
            </Button>
            <Button
              onClick={handleCancel}
              className="flex-1 px-4 py-3 border-2 border-[#00FF41] bg-black hover:bg-[#003300] text-[#00FF41] transition-all duration-300"
            >
              <i className="fas fa-times mr-2"></i>CANCEL
            </Button>
          </div>

          <div className="text-xs text-center opacity-60 text-[#00FF41]">
            * Avatar can be changed once per day
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarModal;
