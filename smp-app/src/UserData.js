let users = JSON.parse(localStorage.getItem('users')) || [
  {
    id: 1,
    email: 'john@example.com',
    password: '123456',
    username: 'john_doe',
    name: 'John Doe',
    bio: 'Web Developer | Photographer | Traveler',
    profileImage: 'https://images.pexels.com/photos/30122027/pexels-photo-30122027/free-photo-of-photographer-in-yellow-jacket-capturing-fall-nature.jpeg?auto=compress&cs=tinysrgb&w=400&lazy=load',
    posts: [
      'https://images.pexels.com/photos/15545371/pexels-photo-15545371/free-photo-of-mirror-and-an-armchair-in-a-room.jpeg?auto=compress&cs=tinysrgb&w=400&lazy=load',
      'https://images.pexels.com/photos/30417380/pexels-photo-30417380/free-photo-of-lone-skier-in-foggy-winter-landscape.jpeg?auto=compress&cs=tinysrgb&w=400&lazy=load',
    ],
  },
  {
    id: 2,
    email: 'jane@example.com',
    password: 'abcdef',
    username: 'jane_smith',
    name: 'Jane Smith',
    bio: 'Designer | Food Lover | Minimalist',
    profileImage: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400&lazy=load',
    posts: [
      'https://images.pexels.com/photos/30391116/pexels-photo-30391116/free-photo-of-open-white-door-leading-to-lush-greenery.jpeg?auto=compress&cs=tinysrgb&w=400&lazy=load',
    ],
  },
];

export const getUsers = () => users;

export const addUser = (newUser) => {
  const updatedUsers = [...users, { id: users.length + 1, ...newUser }];
  users = updatedUsers;
  localStorage.setItem('users', JSON.stringify(updatedUsers));
};
