export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-6 mt-auto">
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold">Critical Touch</p>

        <p className="text-sm text-gray-400">
          Real-time Emergency Response & Life-Saving Assistance
        </p>

        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} All rights reserved
        </p>
      </div>
    </footer>
  );
}
