'use client'

import Link from 'next/link'
import { LuMail, LuMapPin } from 'react-icons/lu'

const FooterSection = () => {
    return (
        <footer className='bg-primary text-primary-foreground/80'>
            {/* Main Footer Content */}
            <div className='container mx-auto px-4 py-12'>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>

                    {/* Column 1: Company/Brand */}
                    <div className='space-y-4'>
                        <div>
                            <h3 className='text-primary-foreground text-2xl font-bold mb-2'>PaiNaiNa</h3>
                            <p className='text-sm text-primary-foreground/60'>Your ultimate travel companion</p>
                        </div>
                        <p className='text-sm'>
                            Plan your perfect trip with ease. Discover amazing destinations,
                            create itineraries, and share your adventures with the world.
                        </p>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div>
                        <h4 className='text-primary-foreground font-semibold text-lg mb-4'>Quick Links</h4>
                        <ul className='space-y-2'>
                            <li>
                                <Link href='/guides' className='hover:text-secondary transition-colors duration-300 text-sm'>
                                    Travel Guides
                                </Link>
                            </li>
                            <li>
                                <Link href='/trips' className='hover:text-secondary transition-colors duration-300 text-sm'>
                                    Plan a Trip
                                </Link>
                            </li>
                            <li>
                                <Link href='/how-it-works' className='hover:text-secondary transition-colors duration-300 text-sm'>
                                    How It Works
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3: Legal */}
                    <div>
                        <h4 className='text-primary-foreground font-semibold text-lg mb-4'>Legal</h4>
                        <ul className='space-y-2'>
                            <li>
                                <Link href='/terms' className='hover:text-secondary transition-colors duration-300 text-sm'>
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link href='/privacy' className='hover:text-secondary transition-colors duration-300 text-sm'>
                                    Privacy Policy
                                </Link>
                            </li>
                        </ul>
                    </div>

                </div>
            </div>

            {/* Bottom Bar */}
            <div className='border-t border-primary-foreground/20'>
                <div className='container mx-auto px-4 py-6'>
                    <div className='flex flex-col md:flex-row justify-between items-center gap-4'>
                        <div className='text-sm text-primary-foreground/60'>
                            © {new Date().getFullYear()} PaiNaiNa. All rights reserved.
                        </div>

                        {/* Contact Info */}
                        <div className='flex flex-wrap gap-4 text-sm text-primary-foreground/60'>
                            <div className='flex items-center gap-2'>
                                <LuMapPin className='w-4 h-4' />
                                <span>Bangkok, Thailand</span>
                            </div>
                            <div className='flex items-center gap-2'>
                                <LuMail className='w-4 h-4' />
                                <span>hello@painaina.com</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default FooterSection
