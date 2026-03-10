
import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const TermsConditions = () => {
  return (
    <div className="min-h-screen font-poppins">
      <Header />
      
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms & Conditions</h1>
            
            <div className="space-y-6 text-gray-700">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Service Agreement</h2>
                <p className="leading-relaxed">
                  By hiring JunkPro Hauling for junk removal services, you agree to these terms and conditions. 
                  Our services include residential and commercial junk removal, furniture removal, estate cleanouts, 
                  and construction debris removal.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Pricing and Payment</h2>
                <p className="leading-relaxed mb-3">
                  All pricing is based on volume and type of items being removed. Payment is due upon completion 
                  of service unless other arrangements have been made in advance.
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>We accept cash, check, and major credit cards</li>
                  <li>Estimates are free and non-binding</li>
                  <li>Final pricing may vary based on actual volume and access conditions</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Liability and Insurance</h2>
                <p className="leading-relaxed">
                  JunkPro Hauling is fully licensed and insured. We maintain general liability insurance and 
                  workers' compensation coverage. Our liability is limited to the value of items being removed 
                  and does not exceed the service fee paid.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Items We Don't Accept</h2>
                <ul className="list-disc list-inside space-y-2">
                  <li>Hazardous materials (paint, chemicals, asbestos)</li>
                  <li>Medical waste or infectious materials</li>
                  <li>Radioactive materials</li>
                  <li>Items containing freon (without proper certification)</li>
                  <li>Wet paint or stains</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Cancellation Policy</h2>
                <p className="leading-relaxed">
                  Services may be cancelled up to 2 hours before scheduled appointment time without penalty. 
                  Cancellations with less than 2 hours notice may be subject to a cancellation fee.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Environmental Responsibility</h2>
                <p className="leading-relaxed">
                  We are committed to environmentally responsible disposal. Items are donated, recycled, 
                  or disposed of in accordance with local regulations whenever possible.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Contact Information</h2>
                <p className="leading-relaxed">
                  For questions about these terms, please contact us at (555) 123-4567 or 
                  info@junkprohauling.com.
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

export default TermsConditions;
