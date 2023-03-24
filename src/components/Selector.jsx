import { Select } from 'antd';

const App = (props) => {
  const {
    list,
    onChange,
    defaultValue,
  } = props;

  const handleChange = (value) => {
    onChange(value);
  };

  return (
  <Select
    defaultValue={defaultValue}
    style={{
      width: 300,
    }}
    onChange={handleChange}
    options={[
      {
        label: 'Danh sách thiết bị',
        options: list,
      }
    ]}
  />
  )
};
export default App;