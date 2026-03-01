import React from 'react';

const RoomQRList = () => {
  // Mock data for the rooms based on your image
  const rooms = [
    { id: '101', qrImage: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Room101' },
    { id: '102', qrImage: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Room102' },
    { id: '103', qrImage: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Room103' },
    { id: '104', qrImage: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Room104' },
    { id: '105', qrImage: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Room105' },
    { id: '106', qrImage: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Room106' },
    { id: '107', qrImage: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Room107' },
    { id: '108', qrImage: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Room108' },
  ];

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Room QR-List</h1>
      
      {/* Responsive Grid: 1 col on mobile, 2 on tablet, 4 on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {rooms.map((room) => (
          <div 
            key={room.id} 
            className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col items-center shadow-sm hover:shadow-md transition-shadow"
          >
            {/* QR Code Placeholder/Image */}
            <div className="w-full aspect-square bg-gray-50 flex items-center justify-center border border-gray-100 mb-4 p-2">
               <img 
                src={room.qrImage} 
                alt={`QR Code for Room ${room.id}`} 
                className="w-full h-full object-contain mix-blend-multiply" 
              />
            </div>
            
            <div className="text-[#4B3F72] font-bold text-sm">
              Room No.{room.id}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomQRList;