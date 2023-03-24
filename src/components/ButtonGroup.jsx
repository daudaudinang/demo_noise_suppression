import { Radio } from 'antd';
const ButtonGroup = (props) => {
  const {
    list,
    value,
    onChange
  } = props;

  return (
    <>
      <Radio.Group value={value} onChange={(e) => onChange(e.target.value)}>
        {list?.map(one => 
          <Radio.Button value={one.value}>{one.label}</Radio.Button>          
        )}
      </Radio.Group>
    </>
  );
};
export default ButtonGroup;