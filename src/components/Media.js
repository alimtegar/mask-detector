const Media = ({ media, setMedia }) => {
    const medias = [
        {
            title: 'Web Camera',
            value: 'webcam',
        },
        {
            title: 'Video',
            value: 'video',
        },
    ];

    return (
        <div className="mb-8">
            <h2 className="text-sm text-gray-900 font-bold mb-4">Selected Media</h2>
            <div className="text-sm -my-1">
                {medias.map((mediasItem, key) => (
                    <div className="my-1" key={key}>
                        <input 
                            className="mr-2" 
                            type="radio" 
                            id={mediasItem.value} 
                            name="media" 
                            value={mediasItem.value} 
                            checked={mediasItem.value === media} 
                            onChange={() => setMedia(mediasItem.value)}
                        />
                        <label className="text-gray-700" forhtml={mediasItem.value}>{mediasItem.title}</label>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Media;