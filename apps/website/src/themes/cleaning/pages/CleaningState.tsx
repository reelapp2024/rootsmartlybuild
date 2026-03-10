
import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { httpFile } from "../../../config";
import CleaningHeader from '../components/CleaningHeader';
import CleaningCTA from '../components/CleaningCTA';
import CleaningServices from '../components/CleaningServices';
import CleaningWhyChooseUs from '../components/CleaningWhyChooseUs';
import CleaningGuarantee from '../components/CleaningGuarantee';
import CleaningProcess from '../components/CleaningProcess';
import CleaningServiceAreas from '../components/CleaningServiceAreas';
import CleaningStateMap from '../components/CleaningStateMap';
import CleaningFAQ from '../components/CleaningFAQ';
import CleaningFooter from '../components/CleaningFooter';
import { MapPin } from 'lucide-react';
import humanizeString from "../../../extras/stringUtils.js";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '../../../components/ui/breadcrumb';
import { Home } from 'lucide-react';
import { Link } from 'react-router-dom';

const CleaningState = () => {
  const { stateName } = useParams();
  const location = useLocation();
  const [projectCategory, setProjectCategory] = useState("");
  const [projectName, setProjectName] = useState("");
  
  const projectId = import.meta.env.VITE_PROJECT_ID;
  const displayStateName = humanizeString(stateName) || 'Your State';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await httpFile.post("/webapp/v1/my_site", {
          projectId,
          pageType: "home",
        });

        if (data.projectInfo) {
          setProjectCategory(data.projectInfo.serviceType);
          setProjectName(data.projectInfo.projectName);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [projectId]);

  return (
    <div className="min-h-screen font-poppins">
      <CleaningHeader />
      
      {/* Breadcrumb */}
      <div className="bg-gray-50 py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/" className="flex items-center">
                    <Home className="w-4 h-4 mr-1" />
                    Home
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/areas">Areas We Serve</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium text-green-600">{displayStateName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>
      
      {/* State Hero */}
      <section className="relative py-20 bg-gradient-to-br from-green-600 to-emerald-600 text-white overflow-hidden min-h-[500px] flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=2126&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-br from-green-600/85 to-emerald-600/85"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full">
          <div className="flex items-center justify-center mb-4">
            <MapPin className="w-8 h-8 text-emerald-400 mr-3" />
            <h1 className="text-4xl md:text-5xl font-bold">
              Professional {projectCategory} Services in {displayStateName}
            </h1>
          </div>
          <p className="text-xl text-green-100 max-w-3xl mx-auto">
            Trusted {projectCategory} services throughout {displayStateName}. {projectName} provides reliable, 
            professional cleaning solutions for homes and businesses across the state.
          </p>
        </div>
      </section>

      <CleaningServices />
      <CleaningWhyChooseUs />
      <CleaningCTA />
      <CleaningGuarantee />
      <CleaningProcess />
      <CleaningCTA />
      <CleaningServiceAreas />
      <CleaningStateMap stateName={displayStateName} countryName="United States" />
      <CleaningFAQ />
      <CleaningCTA />
      <CleaningFooter />
    </div>
  );
};

export default CleaningState;
