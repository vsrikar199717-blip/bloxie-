import { ActionButton } from '../ui/ActionButton';

interface PrivacyNoticeProps {
  onAccept: () => void;
}

export function PrivacyNotice({ onAccept }: PrivacyNoticeProps) {
  return (
    <div className="min-h-screen bg-[#FFFFCC] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Welcome to Robot Reading!
        </h1>

        <div className="space-y-4 text-left text-gray-700 mb-8">
          <p className="text-lg">
            This app saves your child's name and reading level{' '}
            <strong>on this device only</strong>.
          </p>

          <p className="text-lg">
            We never see or store any of your child's data.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
            <p className="text-amber-800 font-medium">
              Only set this up on a private family device, not a shared one.
            </p>
          </div>
        </div>

        <ActionButton onClick={onAccept} color="primary">
          Got it, let's start
        </ActionButton>
      </div>
    </div>
  );
}
