import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy - BananaFood',
  description: 'Privacy Policy for BananaFood',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 p-6">
      <div className="max-w-3xl mx-auto bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 md:p-12">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-zinc-500 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="prose prose-sm max-w-none text-zinc-700 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mt-6 mb-3">1. Information We Collect</h2>
            <p>We collect the following information to provide and improve our services:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> When you sign up, we collect your email address and authentication information through Clerk authentication service.</li>
              <li><strong>Image Data:</strong> When you use our service, you may upload images for translation or recognition. These images are processed temporarily and are not permanently stored on our servers.</li>
              <li><strong>Usage Data:</strong> We collect anonymous usage statistics through Vercel Analytics, including page views, device information, and general usage patterns.</li>
              <li><strong>Technical Information:</strong> We automatically collect certain technical information such as IP address, browser type, and device information.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mt-6 mb-3">2. How We Use Your Information</h2>
            <p>We use the collected information for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide AI-powered menu translation and food recognition services</li>
              <li>To improve and optimize our service quality</li>
              <li>To analyze usage patterns and enhance user experience</li>
              <li>To ensure service security and prevent abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mt-6 mb-3">3. Third-Party Services</h2>
            <p>We use the following third-party services that may collect or process your information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Clerk:</strong> We use Clerk for user authentication. Your account information is managed by Clerk in accordance with their <a href="https://clerk.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Privacy Policy</a>.</li>
              <li><strong>Google Gemini API:</strong> We use Google's Gemini API to process your images for translation and recognition. Images are sent to Google for processing in accordance with Google's <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Privacy Policy</a>.</li>
              <li><strong>Vercel Analytics:</strong> We use Vercel Analytics to collect anonymous usage statistics. This service is subject to Vercel's <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Privacy Policy</a>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mt-6 mb-3">4. Data Security</h2>
            <p>We implement appropriate security measures to protect your information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>All data transmission is encrypted using HTTPS</li>
              <li>Images are processed temporarily and are not permanently stored on our servers</li>
              <li>API calls require authentication tokens</li>
              <li>We follow industry-standard security practices</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mt-6 mb-3">5. Your Rights</h2>
            <p>You have the following rights regarding your personal information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> You can access your account information through your account settings</li>
              <li><strong>Deletion:</strong> You can delete your account at any time through your account settings</li>
              <li><strong>Withdrawal:</strong> You can withdraw your consent at any time by discontinuing use of our service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mt-6 mb-3">6. Data Retention</h2>
            <p>We do not permanently store your uploaded images. Images are processed and then discarded. Your account information is retained as long as your account is active. You can delete your account at any time.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mt-6 mb-3">7. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mt-6 mb-3">8. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us through your account settings or by visiting our support page.</p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-200">
          <Link 
            href="/" 
            className="text-blue-600 hover:underline text-sm"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
