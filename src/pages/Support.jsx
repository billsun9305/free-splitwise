import React from 'react';
import { Link } from 'react-router-dom';

const Support = () => (
  <div className="min-h-screen bg-gray-50 py-8 px-4">
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-8">
      <Link to="/" className="text-emerald-600 hover:underline text-sm">&larr; Back</Link>
      <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">Splitr Support</h1>
      <p className="text-gray-700 mb-6">
        We're a tiny project, so support is by email. Write to{' '}
        <a className="text-emerald-600 underline" href="mailto:es91107@gmail.com">es91107@gmail.com</a>
        {' '}and we'll usually respond within a few days. Please include your
        device model (e.g. iPhone 15 Pro) and a screenshot if the issue is
        visual.
      </p>

      <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">Frequently asked questions</h2>

      <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-1">How do I share a group with a friend?</h3>
      <p className="text-gray-700 mb-3">
        Open the group, tap the share icon in the header, and send the invite
        link. Your friend opens the link on their phone; if they have the
        Splitr app they can join straight from it, otherwise they can join in
        their browser.
      </p>

      <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-1">How do I settle up?</h3>
      <p className="text-gray-700 mb-3">
        Open the group, tap <strong>Settle up</strong> in the footer, choose who
        you're paying, and confirm. If you want to pay them through Venmo, tap
        <strong> Pay via Venmo</strong> — Splitr deep-links into the Venmo app,
        you complete the payment there, and then come back to Splitr to tap
        <strong> I paid in Venmo — mark settled</strong>.
      </p>

      <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-1">How do I delete my account?</h3>
      <p className="text-gray-700 mb-3">
        In the Splitr app, open the <strong>Account</strong> tab, scroll to the
        bottom, and tap <strong>Delete account</strong>. You'll confirm once,
        and then your account, your owned groups, and all of your splits and
        payments are permanently removed.
      </p>

      <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-1">Can I use Splitr without signing in?</h3>
      <p className="text-gray-700 mb-3">
        No. Splitr needs an identity so your groups and balances can sync
        across devices and to other group members. You can sign in with Google
        or Sign in with Apple.
      </p>

      <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-1">Why does Splitr ask for camera access?</h3>
      <p className="text-gray-700 mb-3">
        Only for the optional <strong>scan receipt</strong> feature, which uses
        Apple's on-device text recognition to prefill an expense's amount,
        title, and date. Splitr does not upload, store, or transmit the photo —
        it stays on your phone.
      </p>

      <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-1">Where can I read your privacy policy?</h3>
      <p className="text-gray-700 mb-3">
        Here: <Link to="/privacy" className="text-emerald-600 underline">Privacy Policy</Link>.
      </p>

      <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-1">Still stuck?</h3>
      <p className="text-gray-700">
        Email <a className="text-emerald-600 underline" href="mailto:es91107@gmail.com">es91107@gmail.com</a>{' '}
        with a description of what happened and we'll do our best to help.
      </p>
    </div>
  </div>
);

export default Support;
