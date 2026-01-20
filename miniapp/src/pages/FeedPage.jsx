import React from 'react';

const FeedPage = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Лента объявлений</h1>
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Объявления загружаются</h3>
        <p className="text-gray-600">Подключаемся к базе данных...</p>
      </div>
    </div>
  );
};

export default FeedPage;
