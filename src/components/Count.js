const Count = ({ count }) => (
    <div className="mb-8">
        <h2 className="text-sm text-gray-900 font-bold mb-4">
            Detection Count
                    </h2>
        <ul className="text-sm text-gray-700 border border-gray-300">
            <li className="count-item-masked">
                <div className="px-4 py-3 border-b border-gray-300">
                    <div className="mb-1">
                        People wearing mask
                    </div>
                    <div>
                        <span className="text-gray-900 font-bold">{count.masked} / {count.face}</span>
                    </div>
                </div>
            </li>
            <li className="count-item-not-masked">
                <div className="px-4 py-3">
                    <div className="mb-1">
                        People not wearing mask
                    </div>
                    <div>
                        <span className="text-gray-900 font-bold">{count.notMasked} / {count.face}</span>
                    </div>
                </div>
            </li>
        </ul>
    </div>
);

export default Count;