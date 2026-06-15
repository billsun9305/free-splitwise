import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Privacy policy for Splitr (mobile) + free-splitwise (web).
 *
 * Every claim here maps to a real, observable behavior in the codebase.
 * If you change what the app collects, stores, or shares, update this
 * page so it stays accurate.
 */
const Privacy = () => (
  <div className="min-h-screen bg-gray-50 py-8 px-4">
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-8">
      <Link to="/" className="text-emerald-600 hover:underline text-sm">&larr; Back</Link>
      <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-6">Last updated: 2026-06-15</p>

      <p className="text-gray-700 mb-4">
        Splitr is a tool for tracking shared expenses with friends. This page
        explains, in plain language, what data Splitr collects, where it lives,
        and what you can do with it. We try to be specific and honest. If
        something here is unclear, email us at{' '}
        <a className="text-emerald-600 underline" href="mailto:es91107@gmail.com">es91107@gmail.com</a>{' '}
        and we will fix it.
      </p>

      <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">1. Who we are</h2>
      <p className="text-gray-700 mb-4">
        Splitr is an independent project maintained by Bill Sun. There is no
        company, and there are no employees. You can reach the maintainer at{' '}
        <a className="text-emerald-600 underline" href="mailto:es91107@gmail.com">es91107@gmail.com</a>.
      </p>

      <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">2. What we collect</h2>
      <p className="text-gray-700 mb-2">When you sign in to Splitr we store:</p>
      <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
        <li>Your <strong>name</strong> and <strong>email address</strong>, which Google
          or Apple share with us during sign-in.</li>
        <li>A <strong>stable identifier</strong> from Google (your Google account ID)
          or Apple (their opaque <code className="bg-gray-100 px-1 rounded">sub</code> claim),
          so we recognize you on your next sign-in.</li>
      </ul>
      <p className="text-gray-700 mb-2">As you use Splitr we store the data you create:</p>
      <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
        <li><strong>Groups</strong> you create or join (name, members, an optional hashed
          password used for join-by-name).</li>
        <li><strong>Expenses</strong> (a title, an amount, a date, who paid, how it's
          split, an optional note, an optional category).</li>
        <li><strong>Payments</strong> you record when settling up (who paid whom, how
          much, when).</li>
        <li>An <strong>activity log</strong> derived from the above (who did what when),
          so groups can see recent changes.</li>
      </ul>
      <p className="text-gray-700 mb-4">
        The Splitr mobile app additionally stores some data <strong>only on your
        device</strong>, not on our servers:
      </p>
      <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
        <li>Your sign-in token (in iOS Keychain / Android Keystore via
          <code className="bg-gray-100 px-1 rounded mx-1">expo-secure-store</code>).</li>
        <li>Your own Venmo handle and any Venmo handles you've saved for
          friends, so Splitr can deep-link into the Venmo app when you settle
          up. <strong>Venmo handles never leave your device.</strong></li>
        <li>Your theme preference (light / dark / system).</li>
      </ul>
      <p className="text-gray-700 mb-4">
        If you use the optional <strong>receipt scan</strong> feature, Splitr opens
        the camera or your photo library to pick one receipt image. The image is
        processed <strong>locally, on your device</strong>, using Apple's on-device
        text-recognition framework. We do not upload, store, or transmit the image.
      </p>

      <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">3. What we do NOT collect</h2>
      <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
        <li>No analytics or tracking SDKs. We do not use Google Analytics,
          Firebase, Sentry, Mixpanel, Amplitude, or similar.</li>
        <li>No advertising identifiers. Splitr does not show ads.</li>
        <li>No location data.</li>
        <li>No contacts, calendar, or photo-library scanning beyond the single
          image you explicitly pick for a receipt scan.</li>
      </ul>

      <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">4. Where data lives</h2>
      <p className="text-gray-700 mb-4">
        Server-side data is stored in MongoDB Atlas, accessed through a Spring
        Boot API hosted on Heroku (US region). Traffic to the API uses TLS in
        transit. The hosting providers we rely on (MongoDB Atlas, Heroku) apply
        their own at-rest encryption. We do not currently use end-to-end
        encryption, and we do not claim to.
      </p>

      <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">5. Who we share data with</h2>
      <p className="text-gray-700 mb-4">
        We do not sell your data, and we do not share it with advertisers or
        data brokers. The only parties involved are:
      </p>
      <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
        <li><strong>Google</strong> and <strong>Apple</strong>, when you sign in.
          Their privacy policies cover that interaction.</li>
        <li><strong>MongoDB Atlas</strong> and <strong>Heroku</strong>, our
          hosting providers, who store the data we describe above on our behalf.</li>
        <li><strong>Venmo</strong>, only if you tap a "Pay via Venmo" button —
          and only via a plain deep link. We do not transmit anything to Venmo
          ourselves; your device hands the URL to the Venmo app.</li>
      </ul>

      <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">6. How long we keep it</h2>
      <p className="text-gray-700 mb-4">
        We keep your data for as long as your account exists. If you delete
        your account (see next section), we delete the data immediately;
        groups you own are deleted along with their expenses, payments, and
        activity log. In groups you only belonged to (but did not own), your
        references are replaced with a "Deleted user" placeholder so the
        remaining members' history still renders.
      </p>

      <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">7. Your rights</h2>
      <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
        <li><strong>Delete your account</strong> in the app: Account tab →
          Delete account. This permanently removes your data, immediately.</li>
        <li><strong>Request a copy</strong> of the data we hold about you:
          email us and we'll send it within a reasonable time.</li>
        <li><strong>Correct</strong> your name or any expense detail: edit it
          in the app, or email us if you can't.</li>
      </ul>

      <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">8. Children</h2>
      <p className="text-gray-700 mb-4">
        Splitr is not directed at children under 13 and we do not knowingly
        collect data from them.
      </p>

      <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">9. Changes</h2>
      <p className="text-gray-700 mb-4">
        If we change this policy in a way that affects what we collect or
        share, we'll update the "Last updated" date above and, where the
        change is material, surface it inside the app.
      </p>

      <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">10. Contact</h2>
      <p className="text-gray-700">
        Questions, requests, or complaints:{' '}
        <a className="text-emerald-600 underline" href="mailto:es91107@gmail.com">es91107@gmail.com</a>.
      </p>
    </div>
  </div>
);

export default Privacy;
