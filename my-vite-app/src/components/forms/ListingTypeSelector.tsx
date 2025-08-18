import React from "react";
import { Form, Card } from "antd";

interface ListingTypeSelectorProps {
  onTypeChange: (type: 'sale' | 'rental') => void;
  selectedType?: 'sale' | 'rental';
}

const ListingTypeSelector: React.FC<ListingTypeSelectorProps> = ({ 
  onTypeChange, 
  selectedType = 'sale' 
}) => {
  return (
    <Card title="نوع الإعلان" className="mb-4">
      <Form.Item
        name="listingType"
        label="اختر نوع الإعلان"
        rules={[{ required: true, message: "يرجى اختيار نوع الإعلان" }]}
        initialValue={selectedType}
      >
        <div className="grid grid-cols-2 gap-4">
          <div 
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              selectedType === 'sale' 
                ? 'border-blue-500 bg-blue-50/5' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onClick={() => onTypeChange('sale')}
          >
            <div className="text-center">
              <div className="text-2xl mb-2">🏷️</div>
              <h3 className="font-semibold text-lg mb-1">للبيع</h3>
              <p className="text-gray-600 text-sm">بيع السيارة نهائياً</p>
              <input 
                type="radio" 
                name="listingType" 
                value="sale" 
                checked={selectedType === 'sale'}
                onChange={() => onTypeChange('sale')}
                className="mt-2"
              />
            </div>
          </div>

          <div 
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              selectedType === 'rental' 
                ? 'border-green-500 bg-green-50/5' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onClick={() => onTypeChange('rental')}
          >
            <div className="text-center">
              <div className="text-2xl mb-2">📅</div>
              <h3 className="font-semibold text-lg mb-1">للإيجار</h3>
              <p className="text-gray-600 text-sm">تأجير السيارة شهرياً</p>
              <input 
                type="radio" 
                name="listingType" 
                value="rental" 
                checked={selectedType === 'rental'}
                onChange={() => onTypeChange('rental')}
                className="mt-2"
              />
            </div>
          </div>
        </div>
      </Form.Item>

      {selectedType === 'rental' && (
        <div className="mt-4 p-3 border border-yellow-200 rounded-md">
          <p className="text-yellow-800 text-sm">
            <strong>ملاحظة:</strong> عند اختيار الإيجار، سيتم عرض السيارة للمستأجرين بسعر شهري. 
            تأكد من إدخال جميع التفاصيل والشروط بدقة.
          </p>
        </div>
      )}
    </Card>
  );
};

export default ListingTypeSelector;