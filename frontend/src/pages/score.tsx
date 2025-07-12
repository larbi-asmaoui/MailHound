// score page
import Head from "next/head";

export default function Score() {
  return (
    <>
      <Head>
        <title>Score - Email Verifier</title>
        <meta name="description" content="Score des emails vérifiés" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Titre */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Score des Emails
            </h1>
            <p className="text-lg text-gray-600">
              Consultez le score de vos emails vérifiés.
            </p>
            <p className="text-lg text-gray-600 mt-2">
              تصفح نتائج التحقق من البريد الإلكتروني الخاصة بك هنا.
            </p>
          </div>
          {/* Contenu placeholder */}
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
            <span className="text-2xl text-gray-400 mb-4">⏳</span>
            <p className="text-gray-700 text-center">
              Cette page sera bientôt disponible.
              <br />
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
