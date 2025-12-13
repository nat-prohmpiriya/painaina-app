'use client'

import FooterSection from '@/components/home/FooterSection'

const PrivacyPolicyPage = () => {
    return (
        <>
            <div className='container mx-auto px-4 py-12 max-w-4xl'>
                <h1 className='text-3xl md:text-4xl font-bold mb-8'>Privacy Policy</h1>
                <p className='text-gray-500 mb-8'>Last updated: December 2024</p>

                <div className='prose prose-gray max-w-none space-y-8'>
                    <section>
                        <p className='text-gray-600 leading-relaxed'>
                            PaiNaiNa ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy
                            explains how we collect, use, disclose, and safeguard your information when you use our
                            travel planning service. This policy complies with Thailand's Personal Data Protection Act (PDPA).
                        </p>
                    </section>

                    <section>
                        <h2 className='text-xl font-semibold mb-4'>1. Information We Collect</h2>

                        <h3 className='text-lg font-medium mt-4 mb-2'>Personal Information</h3>
                        <p className='text-gray-600 leading-relaxed'>When you create an account, we collect:</p>
                        <ul className='list-disc list-inside text-gray-600 mt-2 space-y-1'>
                            <li>Name and email address</li>
                            <li>Profile picture (optional)</li>
                            <li>Authentication credentials</li>
                        </ul>

                        <h3 className='text-lg font-medium mt-4 mb-2'>Usage Information</h3>
                        <p className='text-gray-600 leading-relaxed'>We automatically collect:</p>
                        <ul className='list-disc list-inside text-gray-600 mt-2 space-y-1'>
                            <li>Device information (browser type, operating system)</li>
                            <li>IP address and location data</li>
                            <li>Pages visited and features used</li>
                            <li>Date and time of visits</li>
                        </ul>

                        <h3 className='text-lg font-medium mt-4 mb-2'>Travel Information</h3>
                        <p className='text-gray-600 leading-relaxed'>When you use our service, we collect:</p>
                        <ul className='list-disc list-inside text-gray-600 mt-2 space-y-1'>
                            <li>Trip itineraries and plans you create</li>
                            <li>Destinations and places you save</li>
                            <li>Notes and comments</li>
                            <li>Photos you upload</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className='text-xl font-semibold mb-4'>2. How We Use Your Information</h2>
                        <p className='text-gray-600 leading-relaxed'>We use your information to:</p>
                        <ul className='list-disc list-inside text-gray-600 mt-2 space-y-1'>
                            <li>Provide and maintain our Service</li>
                            <li>Create and manage your account</li>
                            <li>Enable trip planning and collaboration features</li>
                            <li>Personalize your experience</li>
                            <li>Send service-related communications</li>
                            <li>Improve our Service and develop new features</li>
                            <li>Ensure security and prevent fraud</li>
                            <li>Comply with legal obligations</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className='text-xl font-semibold mb-4'>3. Legal Basis for Processing (PDPA)</h2>
                        <p className='text-gray-600 leading-relaxed'>Under Thailand's PDPA, we process your data based on:</p>
                        <ul className='list-disc list-inside text-gray-600 mt-2 space-y-1'>
                            <li><strong>Consent:</strong> When you create an account and agree to this policy</li>
                            <li><strong>Contract:</strong> To provide services you requested</li>
                            <li><strong>Legitimate Interest:</strong> To improve our services and ensure security</li>
                            <li><strong>Legal Obligation:</strong> To comply with applicable laws</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className='text-xl font-semibold mb-4'>4. Information Sharing</h2>
                        <p className='text-gray-600 leading-relaxed'>We may share your information with:</p>
                        <ul className='list-disc list-inside text-gray-600 mt-2 space-y-1'>
                            <li><strong>Trip collaborators:</strong> When you invite others to your trips</li>
                            <li><strong>Service providers:</strong> Third parties that help us operate our Service (hosting, analytics)</li>
                            <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
                        </ul>
                        <p className='text-gray-600 leading-relaxed mt-2'>
                            We do not sell your personal information to third parties.
                        </p>
                    </section>

                    <section>
                        <h2 className='text-xl font-semibold mb-4'>5. Data Security</h2>
                        <p className='text-gray-600 leading-relaxed'>
                            We implement appropriate security measures to protect your information, including:
                        </p>
                        <ul className='list-disc list-inside text-gray-600 mt-2 space-y-1'>
                            <li>Encryption of data in transit (HTTPS)</li>
                            <li>Secure data storage</li>
                            <li>Access controls and authentication</li>
                            <li>Regular security assessments</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className='text-xl font-semibold mb-4'>6. Data Retention</h2>
                        <p className='text-gray-600 leading-relaxed'>
                            We retain your personal data for as long as your account is active or as needed to provide
                            services. You can request deletion of your data at any time. Some information may be retained
                            for legal or legitimate business purposes.
                        </p>
                    </section>

                    <section>
                        <h2 className='text-xl font-semibold mb-4'>7. Your Rights Under PDPA</h2>
                        <p className='text-gray-600 leading-relaxed'>You have the right to:</p>
                        <ul className='list-disc list-inside text-gray-600 mt-2 space-y-1'>
                            <li><strong>Access:</strong> Request a copy of your personal data</li>
                            <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
                            <li><strong>Erasure:</strong> Request deletion of your data</li>
                            <li><strong>Restriction:</strong> Limit how we use your data</li>
                            <li><strong>Portability:</strong> Receive your data in a portable format</li>
                            <li><strong>Objection:</strong> Object to certain processing activities</li>
                            <li><strong>Withdraw Consent:</strong> Withdraw consent at any time</li>
                        </ul>
                        <p className='text-gray-600 leading-relaxed mt-2'>
                            To exercise these rights, contact us at hello@painaina.com
                        </p>
                    </section>

                    <section>
                        <h2 className='text-xl font-semibold mb-4'>8. Cookies</h2>
                        <p className='text-gray-600 leading-relaxed'>
                            We use cookies and similar technologies to enhance your experience. For more details,
                            please see our Cookie Policy.
                        </p>
                    </section>

                    <section>
                        <h2 className='text-xl font-semibold mb-4'>9. Children's Privacy</h2>
                        <p className='text-gray-600 leading-relaxed'>
                            Our Service is not intended for children under 13 years of age. We do not knowingly
                            collect personal information from children under 13.
                        </p>
                    </section>

                    <section>
                        <h2 className='text-xl font-semibold mb-4'>10. International Data Transfers</h2>
                        <p className='text-gray-600 leading-relaxed'>
                            Your information may be transferred to and processed in countries other than Thailand.
                            We ensure appropriate safeguards are in place for such transfers in compliance with PDPA.
                        </p>
                    </section>

                    <section>
                        <h2 className='text-xl font-semibold mb-4'>11. Changes to This Policy</h2>
                        <p className='text-gray-600 leading-relaxed'>
                            We may update this Privacy Policy from time to time. We will notify you of any changes by
                            posting the new policy on this page and updating the "Last updated" date.
                        </p>
                    </section>

                    <section>
                        <h2 className='text-xl font-semibold mb-4'>12. Contact Us</h2>
                        <p className='text-gray-600 leading-relaxed'>
                            If you have questions about this Privacy Policy or wish to exercise your rights, contact us at:
                        </p>
                        <div className='text-gray-600 mt-2'>
                            <p>Email: hello@painaina.com</p>
                            <p>Location: Bangkok, Thailand</p>
                        </div>
                    </section>
                </div>
            </div>
            <FooterSection />
        </>
    )
}

export default PrivacyPolicyPage
