import React from "react";

// Define the component props
interface CountryMapProps {
  mapColor?: string;
}

const CountryMap: React.FC<CountryMapProps> = ({ mapColor }) => {
  // Temporary placeholder until jvectormap React 19 compatibility is resolved
  return (
    <div
      className="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center"
      style={{ backgroundColor: mapColor || "#D0D5DD" }}
    >
      <div className="text-center">
        <div className="text-gray-600 dark:text-gray-400 mb-2">
          🗺️ World Map
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Map component temporarily disabled
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
          (React 19 compatibility pending)
        </p>
      </div>
    </div>
  );
};

export default CountryMap;
