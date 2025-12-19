'use client'

import { FooterSection } from '@/components/landing'

const TermsOfServicePage = () => {
    return (
        <>
            <div className='container mx-auto px-4 py-12 max-w-4xl'>
                <h1 className='text-3xl md:text-4xl font-bold mb-8'>Terms of Service</h1>
                <p className='text-gray-500 mb-8'>Last updated: December 2024</p>

                <div className='prose prose-gray max-w-none space-y-8'>
                    <section>
                        <h2 className='text-xl font-semibold mb-4'>1. Acceptance of Terms</h2>
                        <p className='text-gray-600 leading-relaxed'>
                            By accessing or using PaiNaiNa ("the Service"), you agree to be bound by these Terms of Service.
                            If you do not agree to these terms, please do not use our Service.
                        </p>
                    </section>

                    <section>
                        <h2 className='text-xl font-semibold mb-4'>2. Description of Service</h2>
                        <p className='text-gray-600 leading-relaxed'>
                            PaiNaiNa is a travel planning platform that allows users to:
                        </p>
                        <ul className='list-disc list-inside text-gray-600 mt-2 space-y-1'>
                            <li>Create and manage travel itineraries</li>
                            <li>Discover travel guides and destinations</li>
                            <li>Collaborate with others on trip planning</li>
                            <li>Save and organize travel information</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className='text-xl font-semibold mb-4'>3. User Accounts</h2>
                        <p className='text-gray-600 leading-relaxed'>
                            To use certain features of the Service, you must create an account. You are responsible for:
                        </p>
                        <ul className='list-disc list-inside text-gray-600 mt-2 space-y-1'>
                            <li>Maintaining the confidentiality of your account credentials</li>
                            <li>All activities that occur under your account</li>
                            <li>Providing accurate and complete information</li>
                            <li>Notifying us immediately of any unauthorized use</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className='text-xl font-semibold mb-4'>4. User Content</h2>
                        <p className='text-gray-600 leading-relaxed'>
                            You retain ownership of content you create on PaiNaiNa. By posting content, you grant us a
                            non-exclusive, worldwide, royalty-free license to use, display, and distribute your content
                            in connection with the Service.
                        </p>
                        <p className='text-gray-600 leading-relaxed mt-2'>
                            You agree not to post content that is illegal, harmful, threatening, abusive, defamatory,
                            or violates any third-party rights.
                        </p>
                    </section>

                    <section>
                        <h2 className='text-xl font-semibold mb-4'>5. Prohibited Activities</h2>
                        <p className='text-gray-600 leading-relaxed'>You agree not to:</p>
                        <ul className='list-disc list-inside text-gray-600 mt-2 space-y-1'>
                            <li>Use the Service for any unlawful purpose</li>
                            <li>Attempt to gain unauthorized access to our systems</li>
                            <li>Interfere with or disrupt the Service</li>
                            <li>Upload viruses or malicious code</li>
                            <li>Collect user information without consent</li>
                            <li>Use automated systems to access the Service without permission</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className='text-xl font-semibold mb-4'>6. Intellectual Property</h2>
                        <p className='text-gray-600 leading-relaxed'>
                            The Service and its original content, features, and functionality are owned by PaiNaiNa
                            and are protected by international copyright, trademark, and other intellectual property laws.
                        </p>
                    </section>

                    <section>
                        <h2 className='text-xl font-semibold mb-4'>7. Third-Party Services</h2>
                        <p className='text-gray-600 leading-relaxed'>
                            Our Service may contain links to third-party websites or services. We are not responsible
                            for the content, privacy policies, or practices of any third-party sites or services.
                        </p>
                    </section>

                    <section>
                        <h2 className='text-xl font-semibold mb-4'>8. Disclaimer of Warranties</h2>
                        <p className='text-gray-600 leading-relaxed'>
                            The Service is provided "as is" without warranties of any kind. We do not guarantee that
                            the Service will be uninterrupted, secure, or error-free. Travel information provided
                            through the Service is for reference only and may not be accurate or up-to-date.
                        </p>
                    </section>

                    <section>
                        <h2 className='text-xl font-semibold mb-4'>9. Limitation of Liability</h2>
                        <p className='text-gray-600 leading-relaxed'>
                            To the fullest extent permitted by law, PaiNaiNa shall not be liable for any indirect,
                            incidental, special, consequential, or punitive damages arising from your use of the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className='text-xl font-semibold mb-4'>10. Termination</h2>
                        <p className='text-gray-600 leading-relaxed'>
                            We may terminate or suspend your account and access to the Service at our sole discretion,
                            without prior notice, for conduct that we believe violates these Terms or is harmful to
                            other users, us, or third parties.
                        </p>
                    </section>

                    <section>
                        <h2 className='text-xl font-semibold mb-4'>11. Changes to Terms</h2>
                        <p className='text-gray-600 leading-relaxed'>
                            We reserve the right to modify these Terms at any time. We will notify users of significant
                            changes by posting the new Terms on this page and updating the "Last updated" date.
                        </p>
                    </section>

                    <section>
                        <h2 className='text-xl font-semibold mb-4'>12. Governing Law</h2>
                        <p className='text-gray-600 leading-relaxed'>
                            These Terms shall be governed by and construed in accordance with the laws of Thailand,
                            without regard to its conflict of law provisions.
                        </p>
                    </section>

                    <section>
                        <h2 className='text-xl font-semibold mb-4'>13. Contact Us</h2>
                        <p className='text-gray-600 leading-relaxed'>
                            If you have any questions about these Terms, please contact us at:
                        </p>
                        <p className='text-gray-600 mt-2'>
                            Email: hello@painaina.com
                        </p>
                    </section>
                </div>
            </div>
            <FooterSection />
        </>
    )
}

export default TermsOfServicePage
