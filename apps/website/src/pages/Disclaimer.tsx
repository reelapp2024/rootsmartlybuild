
import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Disclaimer = () => {
  return (
    <div className="min-h-screen font-poppins">
      <Header />
      
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">Disclaimer</h1>
            
            <div className="space-y-6 text-gray-700">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">General Information</h2>
                <p className="leading-relaxed">
                  The information on this website is provided on an "as is" basis. To the fullest extent 
                  permitted by law, JunkPro Hauling excludes all representations, warranties, obligations, 
                  and liabilities arising out of or in connection with your use of this website.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Service Limitations</h2>
                <p className="leading-relaxed mb-3">
                  While we strive to provide accurate service estimates and timelines, actual service 
                  may vary based on:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Access conditions to removal site</li>
                  <li>Volume and weight of items</li>
                  <li>Weather conditions</li>
                  <li>Local disposal facility availability</li>
                  <li>Traffic and transportation factors</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Property Damage</h2>
                <p className="leading-relaxed">
                  JunkPro Hauling takes reasonable care to prevent damage to your property during 
                  junk removal services. However, we are not responsible for pre-existing damage 
                  or damage that occurs due to the inherent nature of the removal process, such as 
                  scuff marks on walls during large item removal.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-Party Links</h2>
                <p className="leading-relaxed">
                  Our website may contain links to third-party websites. These links are provided 
                  for convenience only. We do not endorse or take responsibility for the content 
                  of third-party websites.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Estimates and Pricing</h2>
                <p className="leading-relaxed">
                  All estimates provided are approximate and non-binding. Final pricing is determined 
                  upon completion of service based on actual volume, weight, and disposal requirements. 
                  We reserve the right to adjust pricing if conditions differ significantly from 
                  initial assessment.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Force Majeure</h2>
                <p className="leading-relaxed">
                  JunkPro Hauling shall not be liable for any failure to perform due to unforeseen 
                  circumstances or causes beyond our reasonable control, including but not limited to 
                  acts of God, natural disasters, government actions, or other force majeure events.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
                <p className="leading-relaxed">
                  If you have questions about this disclaimer, please contact us at (555) 123-4567 
                  or info@junkprohauling.com.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Disclaimer;
